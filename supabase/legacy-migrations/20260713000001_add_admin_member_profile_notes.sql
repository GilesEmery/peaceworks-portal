create table if not exists public.profile_growth_status (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  process_stage text,
  engagement_status text,
  current_focus text,
  next_step text,
  last_contact_at date,
  next_follow_up_at date,
  growth_summary text,
  support_needs text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id)
);

create table if not exists public.profile_notes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  note_type text not null default 'general',
  body text not null,
  is_private boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_notes_profile_created_idx
  on public.profile_notes(profile_id, created_at desc);

alter table public.profile_growth_status enable row level security;
alter table public.profile_notes enable row level security;

drop policy if exists "profile_growth_status_service_role_all" on public.profile_growth_status;
drop policy if exists "profile_notes_service_role_all" on public.profile_notes;

create policy "profile_growth_status_service_role_all"
  on public.profile_growth_status
  for all
  to service_role
  using (true)
  with check (true);

create policy "profile_notes_service_role_all"
  on public.profile_notes
  for all
  to service_role
  using (true)
  with check (true);
