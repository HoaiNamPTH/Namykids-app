-- Canonical App-runtime schema. All privileged calls arrive after Web token verification.
create schema if not exists app;
create schema if not exists content;
create schema if not exists private;

revoke all on schema app, content, private from public, anon, authenticated;
grant usage on schema app, content, private to service_role;

create table app.identity_binding (
  parent_user_id uuid not null,
  child_id uuid not null,
  source text not null default 'web' check (source = 'web'),
  source_verified_at timestamptz not null,
  source_revision text,
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (parent_user_id, child_id)
);

create unique index identity_binding_one_active_parent_per_child
  on app.identity_binding (child_id) where status = 'active';
create index identity_binding_child_status_idx
  on app.identity_binding (child_id, status);

create table app.entitlement_snapshot (
  parent_user_id uuid primary key,
  entitlement text not null check (entitlement in ('LIMITED', 'FULL')),
  source_revision text,
  effective_at timestamptz not null,
  expires_at timestamptz,
  refreshed_at timestamptz not null default now(),
  check (expires_at is null or expires_at > effective_at)
);

create table app.device_registration (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null,
  installation_id uuid not null,
  platform text not null check (platform in ('ios', 'android')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  registered_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (parent_user_id, installation_id),
  check ((status = 'active' and revoked_at is null) or status = 'revoked')
);
create index device_registration_parent_status_idx
  on app.device_registration (parent_user_id, status);

create table content.content_release (
  id uuid primary key default gen_random_uuid(),
  release_key text not null unique,
  version integer not null check (version > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (release_key, version),
  check ((status = 'draft' and published_at is null) or (status in ('published', 'retired') and published_at is not null))
);

create table content.content_node_version (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references content.content_release (id),
  node_key text not null,
  node_type text not null,
  engine_code text not null check (engine_code in ('E01', 'E02', 'E04')),
  engine_version text not null,
  payload jsonb not null,
  content_hash text not null,
  created_at timestamptz not null default now(),
  unique (release_id, node_key)
);
create index content_node_version_release_node_idx
  on content.content_node_version (release_id, node_key);

create table app.activity_attempt (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null,
  child_id uuid not null,
  release_id uuid not null references content.content_release (id),
  node_version_id uuid not null references content.content_node_version (id),
  attempt_no integer not null check (attempt_no > 0),
  started_at timestamptz not null default now(),
  begin_snapshot jsonb not null,
  source text not null check (source in ('online', 'offline')),
  created_at timestamptz not null default now(),
  foreign key (parent_user_id, child_id) references app.identity_binding (parent_user_id, child_id)
);
create index activity_attempt_child_started_idx
  on app.activity_attempt (child_id, started_at desc);
create index activity_attempt_release_node_idx
  on app.activity_attempt (release_id, node_version_id);

create table app.activity_result (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references app.activity_attempt (id),
  completion_id uuid not null unique,
  outcome text not null,
  score numeric,
  assisted boolean not null default false,
  completed_at timestamptz not null default now(),
  result_payload jsonb not null,
  created_at timestamptz not null default now()
);
create index activity_result_completion_id_idx on app.activity_result (completion_id);

create table app.progress_projection (
  child_id uuid not null,
  node_key text not null,
  release_id uuid not null references content.content_release (id),
  status text not null,
  last_result_id uuid references app.activity_result (id),
  updated_at timestamptz not null default now(),
  primary key (child_id, node_key)
);
create index progress_projection_child_updated_idx
  on app.progress_projection (child_id, updated_at desc);

create table app.resume_pointer (
  child_id uuid primary key,
  release_id uuid not null references content.content_release (id),
  node_version_id uuid not null references content.content_node_version (id),
  engine_code text not null check (engine_code in ('E01', 'E02', 'E04')),
  engine_version text not null,
  resume_payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table private.domain_outbox (
  id uuid primary key default gen_random_uuid(),
  aggregate_type text not null,
  aggregate_id text not null,
  event_type text not null,
  idempotency_key text not null unique,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  available_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index domain_outbox_status_available_idx
  on private.domain_outbox (status, available_at);

create function app.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger identity_binding_set_updated_at
before update on app.identity_binding
for each row execute function app.set_updated_at();

create function app.enforce_device_limit()
returns trigger
language plpgsql
set search_path = pg_catalog, app
as $$
declare
  active_devices integer;
begin
  if new.status <> 'active' then
    return new;
  end if;

  -- Serialize per parent so concurrent registrations cannot exceed two devices.
  perform pg_advisory_xact_lock(hashtextextended(new.parent_user_id::text, 0));
  select count(*) into active_devices
  from app.device_registration
  where parent_user_id = new.parent_user_id
    and status = 'active'
    and id is distinct from new.id;

  if active_devices >= 2 then
    raise exception 'APP_DEVICE_LIMIT_REACHED' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger device_registration_limit
before insert or update of parent_user_id, status on app.device_registration
for each row execute function app.enforce_device_limit();

create function content.protect_release_immutability()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if tg_op = 'DELETE' and old.status in ('published', 'retired') then
    raise exception 'PUBLISHED_RELEASE_IMMUTABLE' using errcode = 'check_violation';
  end if;
  if tg_op = 'UPDATE' and old.status in ('published', 'retired') then
    if old.status = 'published'
       and new.status = 'retired'
       and new.id = old.id
       and new.release_key = old.release_key
       and new.version = old.version
       and new.published_at = old.published_at
       and new.created_at = old.created_at then
      return new;
    end if;
    raise exception 'PUBLISHED_RELEASE_IMMUTABLE' using errcode = 'check_violation';
  end if;
  if tg_op = 'UPDATE' and new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return coalesce(new, old);
end;
$$;

create trigger content_release_immutable
before update or delete on content.content_release
for each row execute function content.protect_release_immutability();

create function content.protect_node_version_immutability()
returns trigger
language plpgsql
set search_path = pg_catalog, content
as $$
declare
  release_status text;
begin
  select status into release_status
  from content.content_release
  where id = coalesce(new.release_id, old.release_id);

  if release_status in ('published', 'retired') then
    raise exception 'PUBLISHED_NODE_VERSION_IMMUTABLE' using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger content_node_version_immutable
before insert or update or delete on content.content_node_version
for each row execute function content.protect_node_version_immutability();

create function public.commit_activity_completion(
  p_parent_user_id uuid,
  p_child_id uuid,
  p_completion_id uuid,
  p_release_id uuid,
  p_node_version_id uuid,
  p_attempt_id uuid,
  p_started_at timestamptz,
  p_source text,
  p_begin_snapshot jsonb,
  p_outcome text,
  p_score numeric,
  p_assisted boolean,
  p_completed_at timestamptz,
  p_result_payload jsonb,
  p_progress_status text,
  p_resume_payload jsonb,
  p_requires_full boolean
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_attempt_id uuid;
  v_result_id uuid;
  v_node_key text;
  v_engine_code text;
  v_engine_version text;
  v_existing jsonb;
  v_attempt_no integer;
begin
  if not exists (
    select 1 from app.identity_binding
    where parent_user_id = p_parent_user_id
      and child_id = p_child_id
      and status = 'active'
  ) then
    raise exception 'APP_CHILD_BINDING_NOT_ACTIVE' using errcode = 'insufficient_privilege';
  end if;

  select jsonb_build_object(
    'attempt_id', a.id,
    'result_id', r.id,
    'completion_id', r.completion_id,
    'idempotent', true
  ) into v_existing
  from app.activity_result r
  join app.activity_attempt a on a.id = r.attempt_id
  where r.completion_id = p_completion_id;
  if v_existing is not null then
    return v_existing;
  end if;

  if p_requires_full and not exists (
    select 1 from app.entitlement_snapshot
    where parent_user_id = p_parent_user_id
      and entitlement = 'FULL'
      and effective_at <= now()
      and (expires_at is null or expires_at > now())
  ) then
    raise exception 'APP_FULL_ENTITLEMENT_REQUIRED' using errcode = 'insufficient_privilege';
  end if;

  select n.node_key, n.engine_code, n.engine_version
  into v_node_key, v_engine_code, v_engine_version
  from content.content_node_version n
  join content.content_release r on r.id = n.release_id
  where n.id = p_node_version_id
    and n.release_id = p_release_id
    and r.status = 'published';
  if v_node_key is null then
    raise exception 'APP_RELEASE_NODE_ENGINE_PIN_INVALID' using errcode = 'check_violation';
  end if;

  if p_source not in ('online', 'offline') then
    raise exception 'APP_ACTIVITY_SOURCE_INVALID' using errcode = 'check_violation';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_child_id::text, 0));
  if p_attempt_id is not null then
    select id into v_attempt_id
    from app.activity_attempt
    where id = p_attempt_id
      and parent_user_id = p_parent_user_id
      and child_id = p_child_id
      and release_id = p_release_id
      and node_version_id = p_node_version_id
    for update;

    if v_attempt_id is null and exists (select 1 from app.activity_attempt where id = p_attempt_id) then
      raise exception 'APP_ATTEMPT_PIN_INVALID' using errcode = 'check_violation';
    end if;
  end if;

  if v_attempt_id is null then
    select coalesce(max(attempt_no), 0) + 1 into v_attempt_no
    from app.activity_attempt
    where child_id = p_child_id and node_version_id = p_node_version_id;

    if p_attempt_id is null then
      insert into app.activity_attempt (
        parent_user_id, child_id, release_id, node_version_id, attempt_no, started_at, begin_snapshot, source
      ) values (
        p_parent_user_id, p_child_id, p_release_id, p_node_version_id, v_attempt_no,
        coalesce(p_started_at, now()), coalesce(p_begin_snapshot, '{}'::jsonb), p_source
      ) returning id into v_attempt_id;
    else
      insert into app.activity_attempt (
        id, parent_user_id, child_id, release_id, node_version_id, attempt_no, started_at, begin_snapshot, source
      ) values (
        p_attempt_id, p_parent_user_id, p_child_id, p_release_id, p_node_version_id, v_attempt_no,
        coalesce(p_started_at, now()), coalesce(p_begin_snapshot, '{}'::jsonb), p_source
      ) returning id into v_attempt_id;
    end if;
  end if;

  insert into app.activity_result (
    attempt_id, completion_id, outcome, score, assisted, completed_at, result_payload
  ) values (
    v_attempt_id, p_completion_id, p_outcome, p_score, coalesce(p_assisted, false), coalesce(p_completed_at, now()),
    coalesce(p_result_payload, '{}'::jsonb)
  ) returning id into v_result_id;

  insert into app.progress_projection (child_id, node_key, release_id, status, last_result_id)
  values (p_child_id, v_node_key, p_release_id, p_progress_status, v_result_id)
  on conflict (child_id, node_key) do update
  set release_id = excluded.release_id,
      status = excluded.status,
      last_result_id = excluded.last_result_id,
      updated_at = now();

  if p_resume_payload is null then
    delete from app.resume_pointer where child_id = p_child_id;
  else
    insert into app.resume_pointer (
      child_id, release_id, node_version_id, engine_code, engine_version, resume_payload
    ) values (
      p_child_id, p_release_id, p_node_version_id, v_engine_code, v_engine_version, p_resume_payload
    ) on conflict (child_id) do update
    set release_id = excluded.release_id,
        node_version_id = excluded.node_version_id,
        engine_code = excluded.engine_code,
        engine_version = excluded.engine_version,
        resume_payload = excluded.resume_payload,
        updated_at = now();
  end if;

  insert into private.domain_outbox (
    aggregate_type, aggregate_id, event_type, idempotency_key, payload
  ) values (
    'activity_attempt', v_attempt_id::text, 'activity_completed', 'completion:' || p_completion_id::text,
    jsonb_build_object('parent_user_id', p_parent_user_id, 'child_id', p_child_id,
                       'attempt_id', v_attempt_id, 'result_id', v_result_id,
                       'completion_id', p_completion_id)
  );

  return jsonb_build_object(
    'attempt_id', v_attempt_id,
    'result_id', v_result_id,
    'completion_id', p_completion_id,
    'idempotent', false
  );
end;
$$;

create function public.revoke_app_identity(
  p_parent_user_id uuid,
  p_child_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_scope text := case when p_child_id is null then 'account' else 'child' end;
  v_bindings integer;
  v_devices integer := 0;
begin
  update app.identity_binding
  set status = 'revoked'
  where parent_user_id = p_parent_user_id
    and status = 'active'
    and (p_child_id is null or child_id = p_child_id);
  get diagnostics v_bindings = row_count;

  if p_child_id is null then
    update app.device_registration
    set status = 'revoked', revoked_at = coalesce(revoked_at, now()), last_seen_at = now()
    where parent_user_id = p_parent_user_id and status = 'active';
    get diagnostics v_devices = row_count;
    delete from app.entitlement_snapshot where parent_user_id = p_parent_user_id;
  end if;

  insert into private.domain_outbox (
    aggregate_type, aggregate_id, event_type, idempotency_key, payload
  ) values (
    'identity', p_parent_user_id::text, 'app_identity_revoked',
    format('revoke:%s:%s:source_revoked', p_parent_user_id, coalesce(p_child_id::text, 'all')),
    jsonb_build_object('parent_user_id', p_parent_user_id, 'child_id', p_child_id,
                       'scope', v_scope, 'reason', 'source_revoked')
  ) on conflict (idempotency_key) do nothing;

  return jsonb_build_object('scope', v_scope, 'bindings_revoked', v_bindings, 'devices_revoked', v_devices);
end;
$$;

create function public.app_has_active_identity_binding(
  p_parent_user_id uuid,
  p_child_id uuid
)
returns boolean
language sql
security definer
set search_path = pg_catalog, app
stable
as $$
  select exists (
    select 1
    from app.identity_binding
    where parent_user_id = p_parent_user_id
      and child_id = p_child_id
      and status = 'active'
  );
$$;

alter table app.identity_binding enable row level security;
alter table app.entitlement_snapshot enable row level security;
alter table app.device_registration enable row level security;
alter table content.content_release enable row level security;
alter table content.content_node_version enable row level security;
alter table app.activity_attempt enable row level security;
alter table app.activity_result enable row level security;
alter table app.progress_projection enable row level security;
alter table app.resume_pointer enable row level security;
alter table private.domain_outbox enable row level security;

-- Explicit restrictive policies document the default-deny mobile Data API posture.
create policy identity_binding_mobile_denied on app.identity_binding as restrictive for all to anon, authenticated using (false) with check (false);
create policy entitlement_snapshot_mobile_denied on app.entitlement_snapshot as restrictive for all to anon, authenticated using (false) with check (false);
create policy device_registration_mobile_denied on app.device_registration as restrictive for all to anon, authenticated using (false) with check (false);
create policy content_release_mobile_denied on content.content_release as restrictive for all to anon, authenticated using (false) with check (false);
create policy content_node_version_mobile_denied on content.content_node_version as restrictive for all to anon, authenticated using (false) with check (false);
create policy activity_attempt_mobile_denied on app.activity_attempt as restrictive for all to anon, authenticated using (false) with check (false);
create policy activity_result_mobile_denied on app.activity_result as restrictive for all to anon, authenticated using (false) with check (false);
create policy progress_projection_mobile_denied on app.progress_projection as restrictive for all to anon, authenticated using (false) with check (false);
create policy resume_pointer_mobile_denied on app.resume_pointer as restrictive for all to anon, authenticated using (false) with check (false);
create policy domain_outbox_mobile_denied on private.domain_outbox as restrictive for all to anon, authenticated using (false) with check (false);

revoke all on all tables in schema app, content, private from public, anon, authenticated;
grant all on all tables in schema app, content, private to service_role;
revoke all on function app.set_updated_at() from public;
revoke all on function app.enforce_device_limit() from public;
revoke all on function content.protect_release_immutability() from public;
revoke all on function content.protect_node_version_immutability() from public;
revoke all on function public.commit_activity_completion(uuid, uuid, uuid, uuid, uuid, uuid, timestamptz, text, jsonb, text, numeric, boolean, timestamptz, jsonb, text, jsonb, boolean) from public, anon, authenticated;
revoke all on function public.revoke_app_identity(uuid, uuid) from public, anon, authenticated;
revoke all on function public.app_has_active_identity_binding(uuid, uuid) from public, anon, authenticated;
grant execute on function public.commit_activity_completion(uuid, uuid, uuid, uuid, uuid, uuid, timestamptz, text, jsonb, text, numeric, boolean, timestamptz, jsonb, text, jsonb, boolean) to service_role;
grant execute on function public.revoke_app_identity(uuid, uuid) to service_role;
grant execute on function public.app_has_active_identity_binding(uuid, uuid) to service_role;
