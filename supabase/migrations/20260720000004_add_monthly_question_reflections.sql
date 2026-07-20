/*
 * Phase 2B Update 7: member Monthly Question reflections.
 *
 * Reflections are retained independently of assignment visibility and content
 * publication state. All member and coach reads remain server-mediated.
 */

begin;

do $preflight$
begin
  if to_regclass('public.profiles') is null
    or to_regclass('public.content_assignments') is null
    or to_regclass('public.content_items') is null
    or to_regclass('public.monthly_questions') is null
  then
    raise exception
      'Monthly Question reflection preflight failed: required foundation tables are missing';
  end if;

  if to_regprocedure('public.set_profile_updated_at()') is null then
    raise exception
      'Monthly Question reflection preflight failed: updated_at trigger function is missing';
  end if;

  if to_regclass('public.monthly_question_reflections') is not null then
    raise exception
      'Monthly Question reflection preflight failed: monthly_question_reflections already exists';
  end if;
end
$preflight$;

create table public.monthly_question_reflections (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  content_assignment_id uuid not null,
  monthly_question_id uuid not null,
  reflection_body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_question_reflections_profile_assignment_key
    unique (profile_id, content_assignment_id),
  constraint monthly_question_reflections_body_length_check
    check (char_length(reflection_body) <= 20000),
  constraint monthly_question_reflections_profile_id_fkey
    foreign key (profile_id)
    references public.profiles(id)
    on delete restrict,
  constraint monthly_question_reflections_content_assignment_id_fkey
    foreign key (content_assignment_id)
    references public.content_assignments(id)
    on delete restrict,
  constraint monthly_question_reflections_monthly_question_id_fkey
    foreign key (monthly_question_id)
    references public.monthly_questions(id)
    on delete restrict
);

create index monthly_question_reflections_profile_updated_idx
  on public.monthly_question_reflections(profile_id, updated_at desc);

create index monthly_question_reflections_assignment_idx
  on public.monthly_question_reflections(content_assignment_id);

create or replace function public.validate_monthly_question_reflection_assignment()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  if not exists (
    select 1
    from public.content_assignments ca
    join public.content_items ci
      on ci.id = ca.content_item_id
     and ci.content_kind = 'monthly_question'
    join public.monthly_questions mq
      on mq.content_item_id = ca.content_item_id
    where ca.id = new.content_assignment_id
      and mq.id = new.monthly_question_id
  ) then
    raise exception
      'Reflection assignment must resolve canonically to the selected Monthly Question'
      using errcode = '23514';
  end if;

  return new;
end
$function$;

create trigger validate_monthly_question_reflection_assignment
before insert or update of content_assignment_id, monthly_question_id
on public.monthly_question_reflections
for each row execute function public.validate_monthly_question_reflection_assignment();

create trigger set_monthly_question_reflections_updated_at
before update on public.monthly_question_reflections
for each row execute function public.set_profile_updated_at();

alter table public.monthly_question_reflections enable row level security;

revoke all on table public.monthly_question_reflections from anon, authenticated;
grant all on table public.monthly_question_reflections to service_role;

create policy "monthly_question_reflections_service_role_all"
  on public.monthly_question_reflections
  for all
  to service_role
  using (true)
  with check (true);

revoke all on function public.validate_monthly_question_reflection_assignment()
  from public, anon, authenticated;
grant execute on function public.validate_monthly_question_reflection_assignment()
  to service_role;

commit;
