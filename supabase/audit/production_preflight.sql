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
