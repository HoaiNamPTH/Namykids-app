create function public.get_app_runtime_entitlement(
  p_parent_user_id uuid
)
returns jsonb
language sql
security invoker
stable
set search_path = pg_catalog
as $$
  select jsonb_build_object(
    'entitlement', case
      when snapshot.entitlement = 'FULL'
        and snapshot.effective_at <= now()
        and (snapshot.expires_at is null or snapshot.expires_at > now()) then 'FULL'
      else 'LIMITED'
    end,
    'source_revision', snapshot.source_revision,
    'effective_at', snapshot.effective_at,
    'expires_at', snapshot.expires_at,
    'refreshed_at', snapshot.refreshed_at,
    'stale', snapshot.parent_user_id is null
      or snapshot.effective_at > now()
      or (snapshot.expires_at is not null and snapshot.expires_at <= now())
  )
  from (select 1) as singleton
  left join app.entitlement_snapshot as snapshot
    on snapshot.parent_user_id = p_parent_user_id;
$$;

create function public.register_app_device(
  p_parent_user_id uuid,
  p_installation_id uuid,
  p_platform text
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  v_device app.device_registration%rowtype;
  v_active_device_count integer;
begin
  if p_platform not in ('ios', 'android') then
    raise exception 'APP_DEVICE_PLATFORM_INVALID' using errcode = 'check_violation';
  end if;

  insert into app.device_registration (
    parent_user_id,
    installation_id,
    platform
  ) values (
    p_parent_user_id,
    p_installation_id,
    p_platform
  )
  on conflict (parent_user_id, installation_id) do update
  set platform = excluded.platform,
      last_seen_at = now()
  where app.device_registration.status = 'active'
  returning * into v_device;

  if v_device.id is null then
    raise exception 'APP_DEVICE_REGISTRATION_NOT_ACTIVE' using errcode = 'insufficient_privilege';
  end if;

  select count(*)::integer
  into v_active_device_count
  from app.device_registration
  where parent_user_id = p_parent_user_id
    and status = 'active';

  return jsonb_build_object(
    'installation_id', v_device.installation_id,
    'status', v_device.status,
    'active_device_count', v_active_device_count
  );
end;
$$;

create function public.get_app_runtime_progress(
  p_parent_user_id uuid,
  p_child_id uuid
)
returns jsonb
language plpgsql
security invoker
stable
set search_path = pg_catalog
as $$
declare
  v_progress jsonb;
  v_resume jsonb;
begin
  if not exists (
    select 1
    from app.identity_binding
    where parent_user_id = p_parent_user_id
      and child_id = p_child_id
      and status = 'active'
  ) then
    raise exception 'APP_CHILD_BINDING_NOT_ACTIVE' using errcode = 'insufficient_privilege';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'node_key', projection.node_key,
        'release_id', projection.release_id,
        'status', projection.status,
        'last_result_id', projection.last_result_id,
        'updated_at', projection.updated_at
      ) order by projection.updated_at desc
    ),
    '[]'::jsonb
  )
  into v_progress
  from app.progress_projection as projection
  where projection.child_id = p_child_id;

  select jsonb_build_object(
    'release_id', resume.release_id,
    'node_version_id', resume.node_version_id,
    'engine_code', resume.engine_code,
    'engine_version', resume.engine_version,
    'resume_payload', resume.resume_payload,
    'updated_at', resume.updated_at
  )
  into v_resume
  from app.resume_pointer as resume
  where resume.child_id = p_child_id;

  return jsonb_build_object(
    'progress', v_progress,
    'resume', v_resume
  );
end;
$$;

revoke all on function public.get_app_runtime_entitlement(uuid) from public, anon, authenticated;
revoke all on function public.register_app_device(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.get_app_runtime_progress(uuid, uuid) from public, anon, authenticated;

grant execute on function public.get_app_runtime_entitlement(uuid) to service_role;
grant execute on function public.register_app_device(uuid, uuid, text) to service_role;
grant execute on function public.get_app_runtime_progress(uuid, uuid) to service_role;
