/*
 * Phase 2B Update 2: Circle and coaching relationship integrity.
 *
 * Production prerequisites verified before this migration was prepared:
 * - relationship status/end-time audit counts are zero;
 * - one active coach_assignments self-assignment exists;
 * - that compatibility row must remain until application reads have moved to
 *   public.circle_coaches.
 *
 * This migration never repairs or deletes relationship data. Guarded
 * preflights fail clearly if production no longer matches those prerequisites.
 */

do $preflight$
begin
  if exists (
    select 1
    from public.circle_memberships
    where
      (status = 'active' and ended_at is not null)
      or (status in ('inactive', 'completed') and ended_at is null)
  ) then
    raise exception
      'Relationship preflight failed: circle_memberships status and ended_at are inconsistent';
  end if;

  if exists (
    select 1
    from public.circle_coaches
    where
      (status = 'active' and ended_at is not null)
      or (status in ('inactive', 'completed') and ended_at is null)
  ) then
    raise exception
      'Relationship preflight failed: circle_coaches status and ended_at are inconsistent';
  end if;

  if exists (
    select 1
    from public.coach_assignments
    where
      (status = 'active' and ended_at is not null)
      or (status in ('inactive', 'completed') and ended_at is null)
  ) then
    raise exception
      'Relationship preflight failed: coach_assignments status and ended_at are inconsistent';
  end if;
end
$preflight$;

alter table public.coach_assignments
  add column is_primary boolean not null default false;

alter table public.circle_memberships
  add constraint circle_memberships_status_end_consistency_check
  check (
    (status = 'active' and ended_at is null)
    or (status in ('inactive', 'completed') and ended_at is not null)
  );

alter table public.circle_coaches
  add constraint circle_coaches_status_end_consistency_check
  check (
    (status = 'active' and ended_at is null)
    or (status in ('inactive', 'completed') and ended_at is not null)
  );

alter table public.coach_assignments
  add constraint coach_assignments_status_end_consistency_check
  check (
    (status = 'active' and ended_at is null)
    or (status in ('inactive', 'completed') and ended_at is not null)
  );

create unique index one_active_primary_coach_per_member
  on public.coach_assignments(member_id)
  where status = 'active'
    and ended_at is null
    and is_primary = true;

/*
 * NOT VALID preserves the one verified compatibility self-assignment while
 * immediately preventing new self-assignments and updates that would create
 * one. Validate this constraint in a later migration only after application
 * verification and controlled retirement of the existing compatibility row.
 */
alter table public.coach_assignments
  add constraint coach_assignments_no_self_assignment_check
  check (coach_id <> member_id)
  not valid;
