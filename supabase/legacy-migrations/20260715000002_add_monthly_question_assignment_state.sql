alter table public.monthly_question_circle_assignments
  add column if not exists assignment_status text not null default 'active';

alter table public.monthly_question_circle_assignments
  add column if not exists visible_from timestamptz;

alter table public.monthly_question_circle_assignments
  add column if not exists archived_at timestamptz;

alter table public.monthly_question_circle_assignments
  add column if not exists coach_introduction text;

alter table public.monthly_question_circle_assignments
  drop constraint if exists monthly_question_assignments_status_check;

alter table public.monthly_question_circle_assignments
  add constraint monthly_question_assignments_status_check check (
    assignment_status in ('active', 'archived')
  );

create index if not exists monthly_question_assignments_status_idx
  on public.monthly_question_circle_assignments(assignment_status);

create index if not exists monthly_question_assignments_visible_idx
  on public.monthly_question_circle_assignments(visible_from);
