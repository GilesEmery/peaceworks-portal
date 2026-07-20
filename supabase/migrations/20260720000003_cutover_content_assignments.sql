/*
 * Phase 2B Update 4: canonical content assignment cutover.
 *
 * content_assignments.content_item_id becomes the required application
 * reference. Legacy content_type/content_id remain populated for compatibility
 * and rollback parity. No assignment or source-content rows are changed here.
 */

begin;

do $preflight$
begin
  if exists (
    select 1
    from public.content_assignments
    where content_item_id is null
  ) then
    raise exception
      'Canonical assignment preflight failed: content_item_id contains null values';
  end if;

  if exists (
    select 1
    from public.content_assignments
    where content_type not in ('monthly_question', 'resource', 'training')
  ) then
    raise exception
      'Canonical assignment preflight failed: unsupported content_type exists';
  end if;

  if exists (
    select 1
    from public.monthly_questions
    where content_item_id is null
  ) or exists (
    select 1
    from public.resources
    where content_item_id is null
  ) or exists (
    select 1
    from public.trainings
    where content_item_id is null
  ) then
    raise exception
      'Canonical assignment preflight failed: a source row lacks content_item_id';
  end if;

  if exists (
    select 1
    from public.content_assignments ca
    left join public.content_items ci on ci.id = ca.content_item_id
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
    where ci.id is null
      or ci.content_kind <> ca.content_type
      or source_map.content_item_id is null
      or source_map.content_item_id <> ca.content_item_id
  ) then
    raise exception
      'Canonical assignment preflight failed: registry and legacy references disagree';
  end if;

  if exists (
    select 1
    from public.content_assignments
    where case
      when audience_type = 'selected_circle'
        then circle_id is null or profile_id is not null
      when audience_type in ('selected_member', 'selected_coach')
        then profile_id is null or circle_id is not null
      else circle_id is not null or profile_id is not null
    end
  ) then
    raise exception
      'Canonical assignment preflight failed: an assignment target shape is invalid';
  end if;

  if exists (
    select 1
    from public.content_assignments
    where visible_from is not null
      and visible_until is not null
      and visible_until < visible_from
  ) then
    raise exception
      'Canonical assignment preflight failed: an assignment visibility window is invalid';
  end if;

  if exists (
    select 1
    from public.content_assignments
    where assignment_status = 'active'
      and circle_id is null
      and profile_id is null
    group by content_item_id, audience_type, placement
    having count(*) > 1
  ) or exists (
    select 1
    from public.content_assignments
    where assignment_status = 'active'
      and audience_type = 'selected_circle'
    group by content_item_id, audience_type, circle_id, placement
    having count(*) > 1
  ) or exists (
    select 1
    from public.content_assignments
    where assignment_status = 'active'
      and audience_type in ('selected_member', 'selected_coach')
    group by content_item_id, audience_type, profile_id, placement
    having count(*) > 1
  ) then
    raise exception
      'Canonical assignment preflight failed: duplicate active logical assignments exist';
  end if;

  if exists (
    select 1
    from public.monthly_question_circle_assignments m
    join public.monthly_questions q on q.id = m.monthly_question_id
    where m.assignment_status <> 'archived'
      and not exists (
        select 1
        from public.content_assignments ca
        where ca.content_item_id = q.content_item_id
          and ca.audience_type = 'selected_circle'
          and ca.circle_id = m.circle_id
          and ca.placement = 'circle_dashboard'
          and ca.assignment_status = 'active'
      )
  ) then
    raise exception
      'Canonical assignment preflight failed: specialized Monthly Question state lacks an active canonical assignment';
  end if;
end
$preflight$;

alter table public.content_assignments
  alter column content_item_id set not null;

alter table public.content_assignments
  add constraint content_assignments_target_shape_check
  check (
    (
      audience_type = 'selected_circle'
      and circle_id is not null
      and profile_id is null
    )
    or
    (
      audience_type in ('selected_member', 'selected_coach')
      and profile_id is not null
      and circle_id is null
    )
    or
    (
      audience_type in (
        'coach_library',
        'all_members',
        'all_circle_members',
        'all_coaches'
      )
      and circle_id is null
      and profile_id is null
    )
  ),
  add constraint content_assignments_visibility_window_check
  check (
    visible_until is null
    or visible_from is null
    or visible_until >= visible_from
  );

create unique index content_assignments_one_active_global
  on public.content_assignments(
    content_item_id,
    audience_type,
    placement
  )
  where assignment_status = 'active'
    and circle_id is null
    and profile_id is null;

create unique index content_assignments_one_active_circle
  on public.content_assignments(
    content_item_id,
    audience_type,
    circle_id,
    placement
  )
  where assignment_status = 'active'
    and audience_type = 'selected_circle';

create unique index content_assignments_one_active_profile
  on public.content_assignments(
    content_item_id,
    audience_type,
    profile_id,
    placement
  )
  where assignment_status = 'active'
    and audience_type in ('selected_member', 'selected_coach');

commit;
