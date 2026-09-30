create function public.get_app_published_content_pin(
  p_node_key text
)
returns jsonb
language plpgsql
security invoker
stable
set search_path = pg_catalog
as $$
declare
  v_release_version integer;
  v_pin_count integer;
  v_pin jsonb;
begin
  if p_node_key is null or btrim(p_node_key) = '' then
    raise exception 'APP_CONTENT_NODE_INVALID' using errcode = 'check_violation';
  end if;

  select release.version
  into v_release_version
  from content.content_node_version as node
  join content.content_release as release on release.id = node.release_id
  where node.node_key = p_node_key
    and node.engine_code = 'E02'
    and release.status = 'published'
  order by release.version desc
  limit 1;

  if v_release_version is null then
    raise exception 'APP_CONTENT_NOT_PUBLISHED' using errcode = 'check_violation';
  end if;

  select count(*)::integer
  into v_pin_count
  from content.content_node_version as node
  join content.content_release as release on release.id = node.release_id
  where node.node_key = p_node_key
    and node.engine_code = 'E02'
    and release.status = 'published'
    and release.version = v_release_version;

  if v_pin_count <> 1 then
    raise exception 'APP_CONTENT_PIN_CONFLICT' using errcode = 'check_violation';
  end if;

  select jsonb_build_object(
    'release_id', release.id,
    'node_version_id', node.id,
    'node_key', node.node_key,
    'engine_code', node.engine_code,
    'engine_version', node.engine_version,
    'payload', node.payload,
    'content_hash', node.content_hash
  )
  into v_pin
  from content.content_node_version as node
  join content.content_release as release on release.id = node.release_id
  where node.node_key = p_node_key
    and node.engine_code = 'E02'
    and release.status = 'published'
    and release.version = v_release_version;

  return v_pin;
end;
$$;

revoke all on function public.get_app_published_content_pin(text) from public, anon, authenticated;
grant execute on function public.get_app_published_content_pin(text) to service_role;
