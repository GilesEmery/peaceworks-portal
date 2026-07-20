/*
 * PeaceWorks production preflight
 *
 * READ ONLY: every statement returns aggregate counts or schema metadata.
 * Healthy identity, assessment, relationship, reference, target-shape, and
 * duplicate counts are zero unless a comment documents a known exception.
 * Do not add private row bodies, emails, answers, or note text to this file.
 */

-- Healthy result: both counts are zero.
select
  (select count(*)
   from public.profiles p
   left join auth.users u on u.id = p.id
   where u.id is null) as profiles_without_auth_users,
  (select count(*)
   from auth.users u
   left join public.profiles p on p.id = u.id
   where p.id is null) as auth_users_without_profiles;

-- Healthy result: every count is zero.
select
  count(*) filter (where user_id is null) as null_user_ids,
  count(*) filter (where created_at is null) as null_created_at,
  count(*) filter (where scores is null) as null_scores,
  count(*) filter (where answers is null) as null_answers,
  count(*) filter (
    where user_id is not null
      and not exists (
        select 1
        from auth.users u
        where u.id = peace_assessment_results.user_id
      )
  ) as orphaned_results
from public.peace_assessment_results;

-- Current audited production exception: one active self-assignment.
-- It must not be changed until application Circle-coach reads and writes use
-- public.circle_coaches.
select
  count(*) as self_assignments,
  count(*) filter (where status = 'active' and ended_at is null)
    as active_self_assignments
from public.coach_assignments
where coach_id = member_id;

-- Healthy result after Update 2: zero duplicate active-primary groups.
select count(*) as members_with_multiple_active_primary_coaches
from (
  select member_id
  from public.coach_assignments
  where status = 'active'
    and ended_at is null
    and is_primary = true
  group by member_id
  having count(*) > 1
) duplicate_primary_groups;

-- Expected during the compatibility window: the no-self constraint exists but
-- is not yet validated. It can be validated only after the known row retires.
select
  conname as constraint_name,
  convalidated as is_validated
from pg_constraint
where conrelid = 'public.coach_assignments'::regclass
  and conname = 'coach_assignments_no_self_assignment_check';

-- Healthy result: both counts are zero.
with coach_profiles as (
  select pr.profile_id
  from public.profile_roles pr
  join public.roles r on r.id = pr.role_id
  where r.name = 'coach'
)
select
  (select count(*)
   from public.coach_assignments ca
   where not exists (
     select 1 from coach_profiles cp where cp.profile_id = ca.coach_id
   )) as direct_assignments_without_coach_role,
  (select count(*)
   from public.circle_coaches cc
   where not exists (
     select 1 from coach_profiles cp where cp.profile_id = cc.coach_id
   )) as circle_coaches_without_coach_role;

-- Healthy result: zero inconsistencies for every relationship table.
select
  'circle_memberships' as relationship,
  count(*) filter (where status = 'active' and ended_at is not null)
    as active_with_end,
  count(*) filter (where status <> 'active' and ended_at is null)
    as ended_without_end
from public.circle_memberships
union all
select
  'circle_coaches',
  count(*) filter (where status = 'active' and ended_at is not null),
  count(*) filter (where status <> 'active' and ended_at is null)
from public.circle_coaches
union all
select
  'coach_assignments',
  count(*) filter (where status = 'active' and ended_at is not null),
  count(*) filter (where status <> 'active' and ended_at is null)
from public.coach_assignments;

-- Healthy result: no returned rows.
select
  ca.content_type,
  count(*) as broken_references
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
group by ca.content_type
order by ca.content_type;

-- Healthy result: no returned rows.
select
  audience_type,
  count(*) as invalid_targets
from public.content_assignments
where case
  when audience_type = 'selected_circle'
    then circle_id is null or profile_id is not null
  when audience_type in ('selected_member', 'selected_coach')
    then profile_id is null or circle_id is not null
  else circle_id is not null or profile_id is not null
end
group by audience_type
order by audience_type;

-- Healthy result: zero duplicate groups.
select count(*) as duplicate_active_assignment_groups
from (
  select 1
  from public.content_assignments
  where assignment_status = 'active'
  group by
    content_type,
    content_id,
    audience_type,
    circle_id,
    profile_id,
    placement
  having count(*) > 1
) duplicate_groups;

-- Healthy target state: zero once canonical assignment backfill is complete.
-- Before that migration this count documents specialized assignments that do
-- not yet have a generalized equivalent.
select
  count(*) as specialized_rows_without_equivalent_canonical_assignment
from public.monthly_question_circle_assignments m
where not exists (
  select 1
  from public.content_assignments ca
  where ca.content_type = 'monthly_question'
    and ca.content_id = m.monthly_question_id
    and ca.circle_id = m.circle_id
    and ca.audience_type = 'selected_circle'
);

-- Diagnostic only: legacy is_private semantics require an approved mapping
-- before repair. This query exposes only an aggregate conflict count.
select
  count(*) as legacy_visibility_conflicts
from public.profile_notes
where
  (is_private = false and visibility = 'admins')
  or
  (is_private = true and visibility <> 'admins');

-- Healthy result: missing and malformed counts are zero.
select
  count(*) filter (where email is null or btrim(email) = '') as missing_email,
  count(*) filter (
    where email is not null
      and email !~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  ) as malformed_email
from public.portal_waitlist;

-- Healthy result: zero duplicate normalized-email groups.
select count(*) as duplicate_normalized_email_groups
from (
  select 1
  from public.portal_waitlist
  where email is not null and btrim(email) <> ''
  group by lower(btrim(email))
  having count(*) > 1
) duplicate_groups;

-- Current verified posture: zero rows. Storage is private and server-mediated.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;

-- Update 3 healthy result: every missing-link and kind-mismatch count is zero.
select
  (select count(*) from public.monthly_questions where content_item_id is null)
    as monthly_questions_without_content_items,
  (select count(*) from public.resources where content_item_id is null)
    as resources_without_content_items,
  (select count(*) from public.trainings where content_item_id is null)
    as trainings_without_content_items,
  (select count(*)
   from public.monthly_questions q
   join public.content_items ci on ci.id = q.content_item_id
   where ci.content_kind <> 'monthly_question')
    as monthly_question_kind_mismatches,
  (select count(*)
   from public.resources r
   join public.content_items ci on ci.id = r.content_item_id
   where ci.content_kind <> 'resource')
    as resource_kind_mismatches,
  (select count(*)
   from public.trainings t
   join public.content_items ci on ci.id = t.content_item_id
   where ci.content_kind <> 'training')
    as training_kind_mismatches;

-- Update 3 healthy result: both counts are zero.
with source_links as (
  select content_item_id from public.monthly_questions
  union all
  select content_item_id from public.resources
  union all
  select content_item_id from public.trainings
)
select
  (select count(*)
   from public.content_items ci
   where not exists (
     select 1 from source_links sl where sl.content_item_id = ci.id
   )) as unreferenced_content_items,
  (select count(*)
   from (
     select content_item_id
     from source_links
     group by content_item_id
     having count(*) > 1
   ) duplicate_links) as content_items_used_by_multiple_sources;

-- Update 3 healthy result: both counts are zero.
with source_map as (
  select 'monthly_question'::text as content_type, id, content_item_id
  from public.monthly_questions
  union all
  select 'resource', id, content_item_id
  from public.resources
  union all
  select 'training', id, content_item_id
  from public.trainings
)
select
  count(*) filter (where ca.content_item_id is null)
    as assignments_without_content_items,
  count(*) filter (
    where ca.content_item_id is not null
      and (
        sm.content_item_id is null
        or sm.content_item_id <> ca.content_item_id
      )
  ) as assignment_legacy_registry_mismatches
from public.content_assignments ca
left join source_map sm
  on sm.content_type = ca.content_type
 and sm.id = ca.content_id;

-- Informational counts. Compare registry and source counts by kind; no fixed
-- production row counts are encoded.
select content_kind, count(*) as registry_count
from public.content_items
group by content_kind
order by content_kind;

select 'monthly_question' as content_kind, count(*) as source_count
from public.monthly_questions
union all
select 'resource', count(*)
from public.resources
union all
select 'training', count(*)
from public.trainings
order by content_kind;

-- Update 4 healthy result: every count is zero.
with source_map as (
  select 'monthly_question'::text as content_kind, id, content_item_id
  from public.monthly_questions
  union all
  select 'resource', id, content_item_id
  from public.resources
  union all
  select 'training', id, content_item_id
  from public.trainings
)
select
  count(*) filter (where ca.content_item_id is null)
    as null_assignment_content_item_ids,
  count(*) filter (
    where ci.id is null
      or ci.content_kind <> ca.content_type
      or sm.content_item_id is null
      or sm.content_item_id <> ca.content_item_id
  ) as legacy_registry_mismatches,
  count(*) filter (
    where case
      when ca.audience_type = 'selected_circle'
        then ca.circle_id is null or ca.profile_id is not null
      when ca.audience_type in ('selected_member', 'selected_coach')
        then ca.profile_id is null or ca.circle_id is not null
      else ca.circle_id is not null or ca.profile_id is not null
    end
  ) as invalid_assignment_target_shapes,
  count(*) filter (
    where ca.visible_from is not null
      and ca.visible_until is not null
      and ca.visible_until < ca.visible_from
  ) as invalid_assignment_visibility_windows,
  count(*) filter (
    where ci.content_kind not in ('monthly_question', 'resource', 'training')
  ) as unsupported_registry_kinds
from public.content_assignments ca
left join public.content_items ci on ci.id = ca.content_item_id
left join source_map sm
  on sm.content_kind = ca.content_type
 and sm.id = ca.content_id;

-- Update 4 healthy result: all three counts are zero.
select
  (
    select count(*)
    from (
      select 1
      from public.content_assignments
      where assignment_status = 'active'
        and circle_id is null
        and profile_id is null
      group by content_item_id, audience_type, placement
      having count(*) > 1
    ) duplicate_groups
  ) as duplicate_active_global_assignments,
  (
    select count(*)
    from (
      select 1
      from public.content_assignments
      where assignment_status = 'active'
        and audience_type = 'selected_circle'
      group by content_item_id, audience_type, circle_id, placement
      having count(*) > 1
    ) duplicate_groups
  ) as duplicate_active_circle_assignments,
  (
    select count(*)
    from (
      select 1
      from public.content_assignments
      where assignment_status = 'active'
        and audience_type in ('selected_member', 'selected_coach')
      group by content_item_id, audience_type, profile_id, placement
      having count(*) > 1
    ) duplicate_groups
  ) as duplicate_active_profile_assignments;

-- Compatibility diagnostic: canonical selected-Circle Monthly Questions
-- currently expect a specialized row for coach_introduction metadata.
-- Healthy result during Update 4: zero.
select count(*) as canonical_monthly_questions_without_specialized_metadata
from public.content_assignments ca
join public.content_items ci
  on ci.id = ca.content_item_id
 and ci.content_kind = 'monthly_question'
join public.monthly_questions q
  on q.content_item_id = ca.content_item_id
where ca.assignment_status = 'active'
  and ca.audience_type = 'selected_circle'
  and ca.placement = 'circle_dashboard'
  and not exists (
    select 1
    from public.monthly_question_circle_assignments m
    where m.monthly_question_id = q.id
      and m.circle_id = ca.circle_id
      and m.assignment_status <> 'archived'
  );

-- Update 7 healthy result: every count is zero. This query returns aggregate
-- metadata only and never selects reflection_body.
select
  count(*) filter (where p.id is null)
    as reflections_without_profiles,
  count(*) filter (where ca.id is null)
    as reflections_without_assignments,
  count(*) filter (
    where ca.id is not null
      and (
        ci.id is null
        or ci.content_kind <> 'monthly_question'
      )
  ) as reflections_on_non_monthly_question_assignments,
  count(*) filter (
    where ca.id is not null
      and (
        mq.id is null
        or mq.content_item_id <> ca.content_item_id
      )
  ) as reflection_assignment_question_mismatches,
  count(*) filter (where char_length(r.reflection_body) > 20000)
    as oversized_reflection_bodies,
  count(*) filter (
    where p.id is not null
      and (
        p.account_status <> 'active'
        or case
          when ca.audience_type = 'all_members' then false
          when ca.audience_type = 'selected_member'
            then ca.profile_id is distinct from r.profile_id
          when ca.audience_type = 'all_circle_members'
            then not exists (
              select 1
              from public.circle_memberships cm
              where cm.profile_id = r.profile_id
                and cm.status = 'active'
                and cm.ended_at is null
            )
          when ca.audience_type = 'selected_circle'
            then not exists (
              select 1
              from public.circle_memberships cm
              where cm.profile_id = r.profile_id
                and cm.circle_id = ca.circle_id
                and cm.status = 'active'
                and cm.ended_at is null
            )
          else true
        end
      )
  ) as reflections_without_current_audience_eligibility
from public.monthly_question_reflections r
left join public.profiles p on p.id = r.profile_id
left join public.content_assignments ca on ca.id = r.content_assignment_id
left join public.content_items ci on ci.id = ca.content_item_id
left join public.monthly_questions mq on mq.id = r.monthly_question_id;

-- Update 7 healthy result: zero duplicate groups.
select count(*) as duplicate_reflection_profile_assignment_groups
from (
  select 1
  from public.monthly_question_reflections
  group by profile_id, content_assignment_id
  having count(*) > 1
) duplicate_groups;

-- Update 9 healthy result: all integrity counts are zero. Source period values
-- are informational compatibility debt until the later retirement migration.
select
  count(*) filter (
    where mqa.question_month is not null and mqa.question_year is null
  ) as assignment_month_without_year,
  count(*) filter (
    where mqa.question_month is null and mqa.question_year is not null
  ) as assignment_year_without_month,
  count(*) filter (
    where mqa.question_month is not null
      and mqa.question_month not between 1 and 12
  ) as invalid_assignment_months,
  count(*) filter (
    where mqa.question_year is not null
      and mqa.question_year not between 2020 and 2100
  ) as invalid_assignment_years,
  count(*) filter (
    where mqa.assignment_status = 'active'
      and (mqa.question_month is null or mqa.question_year is null)
  ) as active_circle_assignments_without_period,
  count(*) filter (
    where not exists (
      select 1
      from public.content_assignments ca
      where ca.content_item_id = mq.content_item_id
        and ca.audience_type = 'selected_circle'
        and ca.circle_id = mqa.circle_id
        and ca.placement = 'circle_dashboard'
    )
  )
    as assignment_period_rows_without_canonical_assignments
from public.monthly_question_circle_assignments mqa
left join public.monthly_questions mq
  on mq.id = mqa.monthly_question_id;

select
  count(*) filter (
    where question_month is not null or question_year is not null
  ) as deprecated_source_period_rows,
  count(*) filter (
    where question_number is not null and btrim(question_number) = ''
  ) as blank_question_numbers,
  count(*) filter (
    where question_number is not null
      and char_length(question_number) > 50
  ) as oversized_question_numbers
from public.monthly_questions;
