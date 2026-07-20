/*
 * Phase 2B Update 10: explicit member-visible profile notes.
 *
 * Apply to an existing production project only after the read-only preflight
 * confirms the current constraint and visibility values are expected.
 */

begin;

do $$
begin
  if to_regclass('public.profile_notes') is null then
    raise exception 'Update 10 preflight failed: public.profile_notes is missing';
  end if;

  if exists (
    select 1
    from public.profile_notes
    where visibility not in ('admins', 'assigned_coaches', 'circle_coaches', 'member')
  ) then
    raise exception 'Update 10 preflight failed: profile_notes has an unsupported visibility value';
  end if;
end
$$;

alter table public.profile_notes
  drop constraint if exists profile_notes_visibility_check;

alter table public.profile_notes
  add constraint profile_notes_visibility_check
  check (visibility in ('admins', 'assigned_coaches', 'circle_coaches', 'member'));

create index if not exists profile_notes_member_visible_idx
  on public.profile_notes(profile_id, updated_at desc)
  where visibility = 'member';

commit;
