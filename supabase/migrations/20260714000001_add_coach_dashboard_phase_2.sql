create table if not exists public.circle_notes (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  note_type text not null default 'general',
  body text not null,
  visibility text not null default 'coaches',
  meeting_date date,
  follow_up_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint circle_notes_note_type_check check (
    note_type in (
      'general',
      'meeting_recap',
      'group_dynamics',
      'facilitation',
      'follow_up',
      'care',
      'prayer',
      'administrative'
    )
  ),
  constraint circle_notes_visibility_check check (visibility in ('coaches', 'admins'))
);

create index if not exists circle_notes_circle_created_idx
  on public.circle_notes(circle_id, created_at desc);

create index if not exists circle_notes_author_idx
  on public.circle_notes(author_id);

create index if not exists circle_notes_type_idx
  on public.circle_notes(note_type);

alter table public.circle_notes enable row level security;

drop policy if exists "circle_notes_service_role_all" on public.circle_notes;

create policy "circle_notes_service_role_all"
  on public.circle_notes
  for all
  to service_role
  using (true)
  with check (true);

alter table public.profile_notes
  add column if not exists visibility text not null default 'admins';

alter table public.profile_notes
  drop constraint if exists profile_notes_visibility_check;

alter table public.profile_notes
  add constraint profile_notes_visibility_check check (
    visibility in ('admins', 'assigned_coaches', 'circle_coaches')
  );

update public.profile_notes
set visibility = 'admins'
where visibility is null;

create index if not exists profile_notes_visibility_idx
  on public.profile_notes(visibility);

alter table public.profile_growth_status
  add column if not exists follow_up_status text not null default 'none';

alter table public.profile_growth_status
  add column if not exists follow_up_completed_at timestamptz;

alter table public.profile_growth_status
  drop constraint if exists profile_growth_status_follow_up_status_check;

alter table public.profile_growth_status
  add constraint profile_growth_status_follow_up_status_check check (
    follow_up_status in ('none', 'planned', 'due', 'completed', 'deferred')
  );
