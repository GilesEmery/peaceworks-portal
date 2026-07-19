/*
 * Phase 2B Update 3: shared content registry foundation.
 *
 * public.content_items is identity infrastructure only. Source tables remain
 * authoritative for content, publication state, scheduling, and visibility.
 * Legacy content_assignments.content_type/content_id remain required during
 * the application compatibility window.
 */

begin;

-- Fail before structural changes if the production schema or legacy references
-- have drifted from the verified Update 2 state.
do $preflight$
begin
  if to_regclass('public.content_items') is not null then
    raise exception
      'Content registry preflight failed: public.content_items already exists';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'content_item_id'
      and table_name in (
        'monthly_questions',
        'resources',
        'trainings',
        'content_assignments'
      )
  ) then
    raise exception
      'Content registry preflight failed: an Update 3 content_item_id column already exists';
  end if;

  if exists (
    select 1
    from public.content_assignments
    where content_type not in ('monthly_question', 'resource', 'training')
  ) then
    raise exception
      'Content registry preflight failed: content_assignments contains an unsupported content_type';
  end if;

  if exists (
    select 1
    from public.content_assignments ca
    where
      (ca.content_type = 'monthly_question' and not exists (
        select 1 from public.monthly_questions q where q.id = ca.content_id
      ))
      or
      (ca.content_type = 'resource' and not exists (
        select 1 from public.resources r where r.id = ca.content_id
      ))
      or
      (ca.content_type = 'training' and not exists (
        select 1 from public.trainings t where t.id = ca.content_id
      ))
  ) then
    raise exception
      'Content registry preflight failed: a legacy assignment references missing source content';
  end if;

  if exists (
    select id
    from (
      select id from public.monthly_questions
      union all
      select id from public.resources
      union all
      select id from public.trainings
    ) source_ids
    group by id
    having count(*) > 1
  ) then
    raise exception
      'Content registry preflight failed: a source UUID is reused across content kinds';
  end if;
end
$preflight$;

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  content_kind text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_items_content_kind_check
    check (content_kind in ('monthly_question', 'resource', 'training'))
);

alter table public.content_items enable row level security;

revoke all on table public.content_items from public, anon, authenticated;
grant all on table public.content_items to service_role;

create policy "content_items_service_role_all"
  on public.content_items
  for all
  to service_role
  using (true)
  with check (true);

create trigger set_content_items_updated_at
before update on public.content_items
for each row execute function public.set_profile_updated_at();

alter table public.monthly_questions
  add column content_item_id uuid,
  add constraint monthly_questions_content_item_id_fkey
    foreign key (content_item_id)
    references public.content_items(id)
    on delete restrict,
  add constraint monthly_questions_content_item_id_key
    unique (content_item_id);

alter table public.resources
  add column content_item_id uuid,
  add constraint resources_content_item_id_fkey
    foreign key (content_item_id)
    references public.content_items(id)
    on delete restrict,
  add constraint resources_content_item_id_key
    unique (content_item_id);

alter table public.trainings
  add column content_item_id uuid,
  add constraint trainings_content_item_id_fkey
    foreign key (content_item_id)
    references public.content_items(id)
    on delete restrict,
  add constraint trainings_content_item_id_key
    unique (content_item_id);

-- Reusing each source UUID makes the one-time backfill deterministic without
-- changing source IDs. The preflight above prevents cross-kind UUID ambiguity.
insert into public.content_items (id, content_kind, created_at, updated_at)
select id, 'monthly_question', created_at, updated_at
from public.monthly_questions
union all
select id, 'resource', created_at, updated_at
from public.resources
union all
select id, 'training', created_at, updated_at
from public.trainings;

update public.monthly_questions
set content_item_id = id
where content_item_id is null;

update public.resources
set content_item_id = id
where content_item_id is null;

update public.trainings
set content_item_id = id
where content_item_id is null;

do $source_backfill_check$
begin
  if exists (
    select 1
    from public.monthly_questions q
    left join public.content_items ci on ci.id = q.content_item_id
    where q.content_item_id is null
      or ci.id is null
      or ci.content_kind <> 'monthly_question'
  ) or exists (
    select 1
    from public.resources r
    left join public.content_items ci on ci.id = r.content_item_id
    where r.content_item_id is null
      or ci.id is null
      or ci.content_kind <> 'resource'
  ) or exists (
    select 1
    from public.trainings t
    left join public.content_items ci on ci.id = t.content_item_id
    where t.content_item_id is null
      or ci.id is null
      or ci.content_kind <> 'training'
  ) then
    raise exception
      'Content registry backfill failed: source coverage or content kind is invalid';
  end if;
end
$source_backfill_check$;

alter table public.monthly_questions
  alter column content_item_id set not null;
alter table public.resources
  alter column content_item_id set not null;
alter table public.trainings
  alter column content_item_id set not null;

create or replace function public.ensure_source_content_item()
returns trigger
language plpgsql
set search_path to ''
as $function$
declare
  expected_kind text := tg_argv[0];
  registered_kind text;
begin
  if tg_op = 'UPDATE'
    and new.content_item_id is distinct from old.content_item_id
  then
    raise exception
      '% content_item_id is immutable once registered', tg_table_name;
  end if;

  if new.content_item_id is null then
    new.content_item_id := new.id;
  end if;

  select ci.content_kind
  into registered_kind
  from public.content_items ci
  where ci.id = new.content_item_id;

  if not found then
    insert into public.content_items (id, content_kind)
    values (new.content_item_id, expected_kind);
  elsif registered_kind <> expected_kind then
    raise exception
      '% must reference a content_item with content_kind %',
      tg_table_name,
      expected_kind;
  end if;

  return new;
end;
$function$;

create trigger ensure_monthly_question_content_item
before insert or update of content_item_id on public.monthly_questions
for each row execute function public.ensure_source_content_item('monthly_question');

create trigger ensure_resource_content_item
before insert or update of content_item_id on public.resources
for each row execute function public.ensure_source_content_item('resource');

create trigger ensure_training_content_item
before insert or update of content_item_id on public.trainings
for each row execute function public.ensure_source_content_item('training');

create or replace function public.prevent_content_item_kind_change()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  if new.content_kind is distinct from old.content_kind then
    raise exception 'content_items.content_kind is immutable';
  end if;

  return new;
end;
$function$;

create trigger prevent_content_item_kind_change
before update of content_kind on public.content_items
for each row execute function public.prevent_content_item_kind_change();

alter table public.content_assignments
  add column content_item_id uuid,
  add constraint content_assignments_content_item_id_fkey
    foreign key (content_item_id)
    references public.content_items(id)
    on delete restrict;

create index content_assignments_content_item_id_idx
  on public.content_assignments(content_item_id);

do $assignment_backfill_preflight$
begin
  if exists (
    select ca.id
    from public.content_assignments ca
    left join (
      select 'monthly_question'::text as content_type, id, content_item_id
      from public.monthly_questions
      union all
      select 'resource', id, content_item_id
      from public.resources
      union all
      select 'training', id, content_item_id
      from public.trainings
    ) source_map
      on source_map.content_type = ca.content_type
     and source_map.id = ca.content_id
    group by ca.id
    having count(source_map.content_item_id) <> 1
  ) then
    raise exception
      'Content assignment backfill failed: an assignment has a missing or ambiguous registry mapping';
  end if;
end
$assignment_backfill_preflight$;

update public.content_assignments ca
set content_item_id = source_map.content_item_id
from (
  select 'monthly_question'::text as content_type, id, content_item_id
  from public.monthly_questions
  union all
  select 'resource', id, content_item_id
  from public.resources
  union all
  select 'training', id, content_item_id
  from public.trainings
) source_map
where source_map.content_type = ca.content_type
  and source_map.id = ca.content_id
  and ca.content_item_id is null;

do $assignment_backfill_check$
begin
  if exists (
    select 1
    from public.content_assignments ca
    left join public.content_items ci on ci.id = ca.content_item_id
    where ca.content_item_id is null
      or ci.id is null
      or ci.content_kind <> ca.content_type
      or ci.id <> ca.content_id
  ) then
    raise exception
      'Content assignment backfill failed: registry and legacy assignment references disagree';
  end if;
end
$assignment_backfill_check$;

create or replace function public.validate_assignment_content_item()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  -- Null remains valid until every application writer has cut over.
  if new.content_item_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.content_items ci
    where ci.id = new.content_item_id
      and ci.content_kind = new.content_type
      and (
        (new.content_type = 'monthly_question' and exists (
          select 1
          from public.monthly_questions q
          where q.id = new.content_id
            and q.content_item_id = new.content_item_id
        ))
        or
        (new.content_type = 'resource' and exists (
          select 1
          from public.resources r
          where r.id = new.content_id
            and r.content_item_id = new.content_item_id
        ))
        or
        (new.content_type = 'training' and exists (
          select 1
          from public.trainings t
          where t.id = new.content_id
            and t.content_item_id = new.content_item_id
        ))
      )
  ) then
    raise exception
      'content_assignments.content_item_id does not match legacy content_type/content_id';
  end if;

  return new;
end;
$function$;

create trigger validate_assignment_content_item
before insert or update of content_item_id, content_type, content_id
on public.content_assignments
for each row execute function public.validate_assignment_content_item();

commit;
