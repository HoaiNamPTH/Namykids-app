begin;
select plan(27);

select has_function('public', 'get_app_runtime_entitlement', array['uuid'], 'entitlement runtime RPC exists');
select has_function('public', 'register_app_device', array['uuid', 'uuid', 'text'], 'device runtime RPC exists');
select has_function('public', 'get_app_runtime_progress', array['uuid', 'uuid'], 'progress runtime RPC exists');

select is(has_function_privilege('anon', 'public.get_app_runtime_entitlement(uuid)', 'execute'), false, 'anon cannot execute entitlement RPC');
select is(has_function_privilege('authenticated', 'public.get_app_runtime_entitlement(uuid)', 'execute'), false, 'authenticated cannot execute entitlement RPC');
select is(has_function_privilege('anon', 'public.register_app_device(uuid,uuid,text)', 'execute'), false, 'anon cannot execute device RPC');
select is(has_function_privilege('authenticated', 'public.register_app_device(uuid,uuid,text)', 'execute'), false, 'authenticated cannot execute device RPC');
select is(has_function_privilege('anon', 'public.get_app_runtime_progress(uuid,uuid)', 'execute'), false, 'anon cannot execute progress RPC');
select is(has_function_privilege('authenticated', 'public.get_app_runtime_progress(uuid,uuid)', 'execute'), false, 'authenticated cannot execute progress RPC');

select is((select prosecdef from pg_proc where oid = 'public.get_app_runtime_entitlement(uuid)'::regprocedure), false, 'entitlement RPC is SECURITY INVOKER');
select is((select prosecdef from pg_proc where oid = 'public.register_app_device(uuid,uuid,text)'::regprocedure), false, 'device RPC is SECURITY INVOKER');
select is((select prosecdef from pg_proc where oid = 'public.get_app_runtime_progress(uuid,uuid)'::regprocedure), false, 'progress RPC is SECURITY INVOKER');
select ok(not has_schema_privilege('authenticated', 'app', 'usage'), 'app schema remains unavailable to authenticated clients');

insert into app.entitlement_snapshot (parent_user_id, entitlement, source_revision, effective_at, expires_at, refreshed_at)
values
  ('10000000-0000-0000-0000-0000000000a1', 'FULL', 'active-revision', now() - interval '1 minute', now() + interval '1 day', now()),
  ('10000000-0000-0000-0000-0000000000a2', 'FULL', 'expired-revision', now() - interval '2 days', now() - interval '1 minute', now() - interval '1 minute');
select is(public.get_app_runtime_entitlement('10000000-0000-0000-0000-0000000000a1')->>'entitlement', 'FULL', 'active FULL entitlement remains FULL');
select is(public.get_app_runtime_entitlement('10000000-0000-0000-0000-0000000000a2')->>'entitlement', 'LIMITED', 'expired FULL entitlement fails closed');
select is((public.get_app_runtime_entitlement('10000000-0000-0000-0000-0000000000a2')->>'stale')::boolean, true, 'expired entitlement is stale');
select is(public.get_app_runtime_entitlement('10000000-0000-0000-0000-0000000000a3')->>'entitlement', 'LIMITED', 'missing entitlement fails closed');
select is((public.get_app_runtime_entitlement('10000000-0000-0000-0000-0000000000a3')->>'stale')::boolean, true, 'missing entitlement is stale');

select is(public.register_app_device('20000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-0000000000b1', 'ios')->>'status', 'active', 'first device is active');
select is((public.register_app_device('20000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-0000000000b1', 'ios')->>'active_device_count')::integer, 1, 'same installation refresh is idempotent');
select is((public.register_app_device('20000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-0000000000b2', 'android')->>'active_device_count')::integer, 2, 'second device is active');
select throws_ok(
  $$ select public.register_app_device('20000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-0000000000b3', 'ios') $$,
  '23514', 'APP_DEVICE_LIMIT_REACHED', 'third active device is rejected by the existing trigger'
);
select throws_ok(
  $$ select public.register_app_device('20000000-0000-0000-0000-0000000000a2', '20000000-0000-0000-0000-0000000000b4', 'windows') $$,
  '23514', 'APP_DEVICE_PLATFORM_INVALID', 'invalid device platform is rejected'
);

insert into content.content_release (id, release_key, version)
values ('30000000-0000-0000-0000-000000000001', 'runtime-progress-release', 1);
insert into content.content_node_version (id, release_id, node_key, node_type, engine_code, engine_version, payload, content_hash)
values ('30000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'runtime-progress-node', 'activity', 'E02', '1.0.0', '{}'::jsonb, 'runtime-progress-hash');
insert into app.identity_binding (parent_user_id, child_id, source_verified_at)
values
  ('30000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-0000000000b1', now()),
  ('30000000-0000-0000-0000-0000000000a2', '30000000-0000-0000-0000-0000000000b2', now());
insert into app.progress_projection (child_id, node_key, release_id, status)
values
  ('30000000-0000-0000-0000-0000000000b1', 'own-node', '30000000-0000-0000-0000-000000000001', 'completed'),
  ('30000000-0000-0000-0000-0000000000b2', 'other-node', '30000000-0000-0000-0000-000000000001', 'completed');
insert into app.resume_pointer (child_id, release_id, node_version_id, engine_code, engine_version, resume_payload)
values ('30000000-0000-0000-0000-0000000000b1', '30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'E02', '1.0.0', '{"round": 1}'::jsonb);
select is(public.get_app_runtime_progress('30000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-0000000000b1')->'progress'->0->>'node_key', 'own-node', 'progress RPC returns only the bound child projection');
select is(public.get_app_runtime_progress('30000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-0000000000b1')->'resume'->>'node_version_id', '30000000-0000-0000-0000-000000000002', 'progress RPC returns the bound child resume pointer');
select throws_ok(
  $$ select public.get_app_runtime_progress('30000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-0000000000b2') $$,
  '42501', 'APP_CHILD_BINDING_NOT_ACTIVE', 'wrong child binding is rejected'
);
update app.identity_binding
set status = 'revoked'
where parent_user_id = '30000000-0000-0000-0000-0000000000a1'
  and child_id = '30000000-0000-0000-0000-0000000000b1';
select throws_ok(
  $$ select public.get_app_runtime_progress('30000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-0000000000b1') $$,
  '42501', 'APP_CHILD_BINDING_NOT_ACTIVE', 'revoked child binding is rejected'
);

select * from finish();
rollback;
