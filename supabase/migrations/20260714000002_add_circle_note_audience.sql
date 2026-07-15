alter table public.circle_notes
  add column if not exists audience_type text not null default 'internal';

alter table public.circle_notes
  add column if not exists published_at timestamptz;

alter table public.circle_notes
  drop constraint if exists circle_notes_audience_type_check;

alter table public.circle_notes
  add constraint circle_notes_audience_type_check check (
    audience_type in ('internal', 'all_circle_members', 'selected_members')
  );

update public.circle_notes
set audience_type = 'internal'
where audience_type is null;

create index if not exists circle_notes_audience_idx
  on public.circle_notes(audience_type);

create table if not exists public.circle_note_recipients (
  id uuid primary key default gen_random_uuid(),
  circle_note_id uuid not null references public.circle_notes(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(circle_note_id, profile_id)
);

create index if not exists circle_note_recipients_note_idx
  on public.circle_note_recipients(circle_note_id);

create index if not exists circle_note_recipients_profile_idx
  on public.circle_note_recipients(profile_id);

alter table public.circle_note_recipients enable row level security;

drop policy if exists "circle_note_recipients_service_role_all"
  on public.circle_note_recipients;

create policy "circle_note_recipients_service_role_all"
  on public.circle_note_recipients
  for all
  to service_role
  using (true)
  with check (true);
