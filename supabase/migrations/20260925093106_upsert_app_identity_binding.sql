create function public.upsert_app_identity_binding(
  p_parent_user_id uuid,
  p_child_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  v_binding app.identity_binding%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_parent_user_id::text, 0));

  if exists (
    select 1
    from app.identity_binding
    where parent_user_id = p_parent_user_id
      and child_id <> p_child_id
      and status = 'active'
  ) then
    raise exception 'APP_PARENT_BINDING_CONFLICT' using errcode = 'check_violation';
  end if;

  if exists (
    select 1
    from app.identity_binding
    where parent_user_id <> p_parent_user_id
      and child_id = p_child_id
      and status = 'active'
  ) then
    raise exception 'APP_CHILD_BINDING_CONFLICT' using errcode = 'check_violation';
  end if;

  insert into app.identity_binding (
    parent_user_id,
    child_id,
    source,
    source_verified_at,
    status
  ) values (
    p_parent_user_id,
    p_child_id,
    'web',
    now(),
    'active'
  )
  on conflict (parent_user_id, child_id) do update
  set source = 'web',
      source_verified_at = now(),
      status = 'active',
      updated_at = now()
  returning * into v_binding;

  return jsonb_build_object(
    'child_id', v_binding.child_id,
    'status', v_binding.status
  );
end;
$$;

revoke all on function public.upsert_app_identity_binding(uuid, uuid) from public, anon, authenticated;
grant execute on function public.upsert_app_identity_binding(uuid, uuid) to service_role;
