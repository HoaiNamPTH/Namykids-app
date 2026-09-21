begin;
select plan(46);

select has_schema('app', 'app schema exists');
select has_schema('content', 'content schema exists');
select has_schema('private', 'private schema exists');
select has_table('app', 'identity_binding', 'identity binding exists');
select has_table('app', 'entitlement_snapshot', 'entitlement snapshot exists');
select has_table('app', 'device_registration', 'device registration exists');
select has_table('content', 'content_release', 'content release exists');
select has_table('content', 'content_node_version', 'content node version exists');
select has_table('app', 'activity_attempt', 'activity attempt exists');
select has_table('app', 'activity_result', 'activity result exists');
select has_table('app', 'progress_projection', 'progress projection exists');
select has_table('app', 'resume_pointer', 'resume pointer exists');
select has_table('private', 'domain_outbox', 'private outbox exists');
select has_function('public', 'commit_activity_completion', array[
  'uuid', 'uuid', 'uuid', 'uuid', 'uuid', 'uuid', 'timestamp with time zone', 'text', 'jsonb', 'text', 'numeric', 'boolean', 'timestamp with time zone', 'jsonb', 'text', 'jsonb', 'boolean'
], 'completion RPC exists');
select has_function('public', 'revoke_app_identity', array['uuid', 'uuid'], 'revoke RPC exists');
select is(
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname in ('app', 'content', 'private') and c.relkind = 'r' and c.relrowsecurity),
  10::bigint,
  'RLS is enabled on every App runtime table'
);
select ok(not has_schema_privilege('anon', 'private', 'usage'), 'anon cannot use private schema');
select ok(not has_schema_privilege('authenticated', 'app', 'usage'), 'authenticated cannot use app schema');
select ok(not has_table_privilege('anon', 'app.activity_attempt', 'insert'), 'anon cannot insert activity attempts');
select ok(not has_table_privilege('authenticated', 'app.activity_result', 'update'), 'authenticated cannot update activity results');
select ok(not has_table_privilege('anon', 'private.domain_outbox', 'select'), 'anon cannot read outbox');
select is(has_function_privilege('anon', 'public.commit_activity_completion(uuid,uuid,uuid,uuid,uuid,uuid,timestamp with time zone,text,jsonb,text,numeric,boolean,timestamp with time zone,jsonb,text,jsonb,boolean)', 'execute'), false, 'anon cannot execute completion RPC');
select is(has_function_privilege('authenticated', 'public.revoke_app_identity(uuid,uuid)', 'execute'), false, 'authenticated cannot execute revoke RPC');

insert into content.content_release (id, release_key, version)
values ('00000000-0000-0000-0000-000000000001', 'test-release', 1);
insert into content.content_node_version (id, release_id, node_key, node_type, engine_code, engine_version, payload, content_hash)
values ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'select-a', 'activity', 'E01', '1.0.0', '{}'::jsonb, 'hash-a');
update content.content_release
set status = 'published', published_at = now()
where id = '00000000-0000-0000-0000-000000000001';

select throws_ok(
  $$ update content.content_node_version set content_hash = 'changed' where id = '00000000-0000-0000-0000-000000000002' $$,
  '23514', 'PUBLISHED_NODE_VERSION_IMMUTABLE', 'published node version is immutable'
);
select throws_ok(
  $$ update content.content_release set release_key = 'changed' where id = '00000000-0000-0000-0000-000000000001' $$,
  '23514', 'PUBLISHED_RELEASE_IMMUTABLE', 'published release is immutable'
);
insert into content.content_release (id, release_key, version)
values ('00000000-0000-0000-0000-000000000003', 'draft-engine-check', 1);
select throws_ok(
  $$ insert into content.content_node_version (release_id, node_key, node_type, engine_code, engine_version, payload, content_hash) values ('00000000-0000-0000-0000-000000000003', 'bad-engine', 'activity', 'E03', '1.0.0', '{}'::jsonb, 'bad') $$,
  '23514', null, 'unsupported production engine is rejected'
);

insert into app.identity_binding (parent_user_id, child_id, source_verified_at)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', now()),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000b2', now());
insert into app.entitlement_snapshot (parent_user_id, entitlement, effective_at, refreshed_at)
values ('00000000-0000-0000-0000-0000000000a1', 'FULL', now(), now());

select lives_ok(
  $$ select public.commit_activity_completion(
    '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1',
    '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002', null, now(), 'online', '{}'::jsonb,
    'passed', 10, false, now(), '{}'::jsonb, 'completed', '{"step": 2}'::jsonb, false
  ) $$,
  'normal completion commits atomically'
);
select is((select count(*) from app.activity_result), 1::bigint, 'completion writes one result');
select is((select count(*) from private.domain_outbox where event_type = 'activity_completed'), 1::bigint, 'completion writes one outbox event');
select is((select resume_payload from app.resume_pointer where child_id = '00000000-0000-0000-0000-0000000000b1'), '{"step": 2}'::jsonb, 'resume pointer retains pinned payload');
select is((select engine_code from app.resume_pointer where child_id = '00000000-0000-0000-0000-0000000000b1'), 'E01', 'resume pointer retains engine pin');
select lives_ok(
  $$ select public.commit_activity_completion(
    '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1',
    '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002', null, now(), 'online', '{}'::jsonb,
    'passed', null, false, now(), '{}'::jsonb, 'completed', null, false
  ) $$,
  'duplicate completion is idempotent'
);
select is((select count(*) from app.activity_result), 1::bigint, 'duplicate completion does not duplicate result');
select is((select count(*) from private.domain_outbox where event_type = 'activity_completed'), 1::bigint, 'duplicate completion does not duplicate outbox');
select throws_ok(
  $$ select public.commit_activity_completion(
    '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1',
    '00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002', null, now(), 'online', '{}'::jsonb,
    'passed', 10, false, now(), '{}'::jsonb, null, null, false
  ) $$,
  '23502', null, 'forced failure rolls back completion'
);
select is((select count(*) from app.activity_result where completion_id = '00000000-0000-0000-0000-0000000000c2'), 0::bigint, 'forced failure left no result');
select throws_ok(
  $$ select public.commit_activity_completion(
    '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b2',
    '00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002', null, now(), 'online', '{}'::jsonb,
    'passed', 10, false, now(), '{}'::jsonb, 'completed', null, false
  ) $$,
  '42501', 'APP_CHILD_BINDING_NOT_ACTIVE', 'wrong child is rejected'
);
select throws_ok(
  $$ select public.commit_activity_completion(
    '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000b2',
    '00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002', null, now(), 'online', '{}'::jsonb,
    'passed', 10, false, now(), '{}'::jsonb, 'completed', null, true
  ) $$,
  '42501', 'APP_FULL_ENTITLEMENT_REQUIRED', 'LIMITED parent cannot complete FULL activity'
);

insert into app.device_registration (parent_user_id, installation_id, platform)
values
  ('00000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-000000000001', 'ios'),
  ('00000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-000000000002', 'android');
select throws_ok(
  $$ insert into app.device_registration (parent_user_id, installation_id, platform) values ('00000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-000000000003', 'ios') $$,
  '23514', 'APP_DEVICE_LIMIT_REACHED', 'third active device is rejected'
);
update app.device_registration set status = 'revoked', revoked_at = now()
where installation_id = '10000000-0000-0000-0000-000000000001';
select lives_ok(
  $$ insert into app.device_registration (parent_user_id, installation_id, platform) values ('00000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-000000000003', 'ios') $$,
  'device replacement succeeds after revoke'
);

select lives_ok($$ select public.revoke_app_identity('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1') $$, 'child revoke succeeds');
select throws_ok(
  $$ select public.commit_activity_completion(
    '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1',
    '00000000-0000-0000-0000-0000000000c5', '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002', null, now(), 'online', '{}'::jsonb,
    'passed', 10, false, now(), '{}'::jsonb, 'completed', null, false
  ) $$,
  '42501', 'APP_CHILD_BINDING_NOT_ACTIVE', 'child revoke blocks new writes'
);
select lives_ok($$ select public.revoke_app_identity('00000000-0000-0000-0000-0000000000a1') $$, 'account revoke succeeds');
select is((select count(*) from app.device_registration where parent_user_id = '00000000-0000-0000-0000-0000000000a1' and status = 'active'), 0::bigint, 'account revoke disables devices');
select is((select count(*) from app.entitlement_snapshot where parent_user_id = '00000000-0000-0000-0000-0000000000a1'), 0::bigint, 'account revoke removes entitlement snapshot');
select is((select count(*) from private.domain_outbox where event_type = 'app_identity_revoked'), 2::bigint, 'revoke operations create outbox records');

select * from finish();
rollback;
