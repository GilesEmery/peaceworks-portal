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
