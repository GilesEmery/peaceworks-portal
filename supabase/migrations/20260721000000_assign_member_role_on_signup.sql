/*
 * Assign the canonical Member role during trusted new-user provisioning.
 * Future sign-ups only; existing profiles and role relationships are unchanged.
 */

begin;

do $$
begin
  if to_regclass('public.profiles') is null
    or to_regclass('public.roles') is null
    or to_regclass('public.profile_roles') is null then
    raise exception 'Member-role provisioning preflight failed: foundational tables are missing';
  end if;

  if (select count(*) from public.roles where name = 'member') <> 1 then
    raise exception 'Member-role provisioning preflight failed: expected exactly one canonical member role';
  end if;
end
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  member_role_id uuid;
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  )
  on conflict (id) do nothing;

  select roles.id
  into member_role_id
  from public.roles
  where roles.name = 'member';

  if member_role_id is null then
    raise exception 'New-user provisioning failed: canonical member role is missing';
  end if;

  insert into public.profile_roles (profile_id, role_id)
  values (new.id, member_role_id)
  on conflict (profile_id, role_id) do nothing;

  return new;
end;
$function$;

commit;
