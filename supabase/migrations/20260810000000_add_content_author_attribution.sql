alter table public.communications
  add column if not exists author_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists author_name text;

alter table public.monthly_questions
  add column if not exists author_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists author_name text;

alter table public.resources
  add column if not exists author_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists author_name text;

alter table public.trainings
  add column if not exists author_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists author_name text;

create index if not exists communications_author_profile_idx
  on public.communications(author_profile_id);
create index if not exists monthly_questions_author_profile_idx
  on public.monthly_questions(author_profile_id);
create index if not exists resources_author_profile_idx
  on public.resources(author_profile_id);
create index if not exists trainings_author_profile_idx
  on public.trainings(author_profile_id);
