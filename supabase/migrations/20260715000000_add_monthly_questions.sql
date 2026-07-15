create table if not exists public.monthly_questions (
  id uuid primary key default gen_random_uuid(),
  title text,
  opening_reflection text,
  question_text text not null,
  guidance text,
  discussion_prompts jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_questions_status_check check (
    status in ('draft', 'published', 'archived')
  ),
  constraint monthly_questions_discussion_prompts_array_check check (
    jsonb_typeof(discussion_prompts) = 'array'
  )
);

create index if not exists monthly_questions_status_idx
  on public.monthly_questions(status);

create index if not exists monthly_questions_published_idx
  on public.monthly_questions(published_at desc);

create index if not exists monthly_questions_created_by_idx
  on public.monthly_questions(created_by);

create index if not exists monthly_questions_updated_idx
  on public.monthly_questions(updated_at desc);

alter table public.monthly_questions enable row level security;

drop policy if exists "monthly_questions_service_role_all"
  on public.monthly_questions;

create policy "monthly_questions_service_role_all"
  on public.monthly_questions
  for all
  to service_role
  using (true)
  with check (true);

create table if not exists public.monthly_question_circle_assignments (
  id uuid primary key default gen_random_uuid(),
  monthly_question_id uuid not null
    references public.monthly_questions(id) on delete cascade,
  circle_id uuid not null references public.circles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(monthly_question_id, circle_id)
);

create index if not exists monthly_question_assignments_question_idx
  on public.monthly_question_circle_assignments(monthly_question_id);

create index if not exists monthly_question_assignments_circle_idx
  on public.monthly_question_circle_assignments(circle_id);

create index if not exists monthly_question_assignments_circle_question_idx
  on public.monthly_question_circle_assignments(circle_id, monthly_question_id);

alter table public.monthly_question_circle_assignments enable row level security;

drop policy if exists "monthly_question_assignments_service_role_all"
  on public.monthly_question_circle_assignments;

create policy "monthly_question_assignments_service_role_all"
  on public.monthly_question_circle_assignments
  for all
  to service_role
  using (true)
  with check (true);
