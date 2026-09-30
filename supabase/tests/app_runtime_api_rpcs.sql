begin;
select plan(48);

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

select has_function('public', 'upsert_app_identity_binding', array['uuid', 'uuid'], 'bootstrap binding RPC exists');
select is(has_function_privilege('anon', 'public.upsert_app_identity_binding(uuid,uuid)', 'execute'), false, 'anon cannot execute bootstrap binding RPC');
select is(has_function_privilege('authenticated', 'public.upsert_app_identity_binding(uuid,uuid)', 'execute'), false, 'authenticated cannot execute bootstrap binding RPC');
select is(has_function_privilege('service_role', 'public.upsert_app_identity_binding(uuid,uuid)', 'execute'), true, 'service role can execute bootstrap binding RPC');
select is((select prosecdef from pg_proc where oid = 'public.upsert_app_identity_binding(uuid,uuid)'::regprocedure), false, 'bootstrap binding RPC is SECURITY INVOKER');
select is(public.upsert_app_identity_binding('40000000-0000-0000-0000-0000000000a1', '40000000-0000-0000-0000-0000000000b1')->>'status', 'active', 'first bootstrap binding activates');
select is(public.upsert_app_identity_binding('40000000-0000-0000-0000-0000000000a1', '40000000-0000-0000-0000-0000000000b1')->>'child_id', '40000000-0000-0000-0000-0000000000b1', 'same bootstrap binding is idempotent');
select throws_ok(
  $$ select public.upsert_app_identity_binding('40000000-0000-0000-0000-0000000000a1', '40000000-0000-0000-0000-0000000000b2') $$,
  '23514', 'APP_PARENT_BINDING_CONFLICT', 'a parent cannot activate a second child binding'
);
select throws_ok(
  $$ select public.upsert_app_identity_binding('40000000-0000-0000-0000-0000000000a2', '40000000-0000-0000-0000-0000000000b1') $$,
  '23514', 'APP_CHILD_BINDING_CONFLICT', 'a child cannot activate a second parent binding'
);

select has_function('public', 'get_app_published_content_pin', array['text'], 'published content pin RPC exists');
select is(has_function_privilege('anon', 'public.get_app_published_content_pin(text)', 'execute'), false, 'anon cannot execute content pin RPC');
select is(has_function_privilege('authenticated', 'public.get_app_published_content_pin(text)', 'execute'), false, 'authenticated cannot execute content pin RPC');
select is(has_function_privilege('service_role', 'public.get_app_published_content_pin(text)', 'execute'), true, 'service role can execute content pin RPC');
select is((select prosecdef from pg_proc where oid = 'public.get_app_published_content_pin(text)'::regprocedure), false, 'content pin RPC is SECURITY INVOKER');
select throws_ok($$ select public.get_app_published_content_pin('unpublished-test-node') $$, '23514', 'APP_CONTENT_NOT_PUBLISHED', 'no published content fails closed');

-- LOCAL TEST_FIXTURE / DEV-ONLY: transaction-scoped technical pins, never production publication.
insert into content.content_release (id, release_key, version, status, published_at) values
  ('50000000-0000-0000-0000-000000000001', 'dev-local-only-draft', 1, 'draft', null),
  ('50000000-0000-0000-0000-000000000002', 'dev-local-only-retired', 2, 'draft', null),
  ('50000000-0000-0000-0000-000000000003', 'dev-local-only-first-slice-v1', 3, 'draft', null),
  ('50000000-0000-0000-0000-000000000004', 'dev-local-only-first-slice-v2', 4, 'draft', null);
insert into content.content_node_version (id, release_id, node_key, node_type, engine_code, engine_version, payload, content_hash) values
  ('50000000-0000-0000-0000-000000000011', '50000000-0000-0000-0000-000000000001', 'alphabet-missing-letters', 'activity', 'E02', '1.0.0-dev', '{}'::jsonb, 'draft-fixture'),
  ('50000000-0000-0000-0000-000000000012', '50000000-0000-0000-0000-000000000002', 'alphabet-missing-letters', 'activity', 'E02', '1.0.0-dev', '{}'::jsonb, 'retired-fixture'),
  ('50000000-0000-0000-0000-000000000013', '50000000-0000-0000-0000-000000000003', 'alphabet-missing-letters', 'activity', 'E02', '1.0.0-dev', '{}'::jsonb, 'fixture-v1'),
  ('50000000-0000-0000-0000-000000000014', '50000000-0000-0000-0000-000000000004', 'alphabet-missing-letters', 'activity', 'E02', '1.0.1-dev', '{}'::jsonb, 'fixture-v2'),
  ('50000000-0000-0000-0000-000000000015', '50000000-0000-0000-0000-000000000004', 'not-e02', 'activity', 'E01', '1.0.0-dev', '{}'::jsonb, 'not-e02-fixture');
update content.content_release
set status = 'retired', published_at = now()
where id = '50000000-0000-0000-0000-000000000002';
update content.content_release set status = 'published' where id in (
  '50000000-0000-0000-0000-000000000003',
  '50000000-0000-0000-0000-000000000004'
);
select is(public.get_app_published_content_pin('alphabet-missing-letters')->>'release_id', '50000000-0000-0000-0000-000000000004', 'highest published release version is selected');
select is(public.get_app_published_content_pin('alphabet-missing-letters')->>'node_version_id', '50000000-0000-0000-0000-000000000014', 'returned node version belongs to selected published release');
select is(public.get_app_published_content_pin('alphabet-missing-letters')->>'content_hash', 'fixture-v2', 'returned content hash is immutable pin data');
select is(public.get_app_published_content_pin('alphabet-missing-letters')->>'engine_code', 'E02', 'returned content pin is the approved first-slice engine');
select throws_ok($$ select public.get_app_published_content_pin('not-e02') $$, '23514', 'APP_CONTENT_NOT_PUBLISHED', 'non-E02 node is not eligible for the first slice pin');
insert into content.content_release (id, release_key, version, status, published_at)
values ('50000000-0000-0000-0000-000000000005', 'dev-local-only-conflict', 4, 'draft', null);
insert into content.content_node_version (id, release_id, node_key, node_type, engine_code, engine_version, payload, content_hash)
values ('50000000-0000-0000-0000-000000000016', '50000000-0000-0000-0000-000000000005', 'alphabet-missing-letters', 'activity', 'E02', '1.0.1-dev', '{}'::jsonb, 'fixture-conflict');
update content.content_release set status = 'published' where id = '50000000-0000-0000-0000-000000000005';
select throws_ok($$ select public.get_app_published_content_pin('alphabet-missing-letters') $$, '23514', 'APP_CONTENT_PIN_CONFLICT', 'ambiguous highest published version is rejected');

select * from finish();
rollback;
