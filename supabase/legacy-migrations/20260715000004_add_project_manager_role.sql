do $$
declare
  has_description_column boolean;
begin
  if exists (
    select 1
    from public.roles
    where name = 'project_manager'
  ) then
    update public.roles
    set label = 'Project Manager'
    where name = 'project_manager';
  else
    insert into public.roles (id, name, label)
    values (gen_random_uuid(), 'project_manager', 'Project Manager');
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'roles'
      and column_name = 'description'
  )
  into has_description_column;

  if has_description_column then
    execute $sql$
      update public.roles
      set description = 'Access to the PeaceWorks Project Dashboard and project-management workspace.'
      where name = 'project_manager'
    $sql$;
  end if;
end $$;
