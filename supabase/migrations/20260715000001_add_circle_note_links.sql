create table if not exists public.circle_note_links (
  id uuid primary key default gen_random_uuid(),
  circle_note_id uuid not null
    references public.circle_notes(id) on delete cascade,
  label text,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists circle_note_links_note_idx
  on public.circle_note_links(circle_note_id);

create index if not exists circle_note_links_note_order_idx
  on public.circle_note_links(circle_note_id, sort_order);

alter table public.circle_note_links enable row level security;

drop policy if exists "circle_note_links_service_role_all"
  on public.circle_note_links;

create policy "circle_note_links_service_role_all"
  on public.circle_note_links
  for all
  to service_role
  using (true)
  with check (true);
