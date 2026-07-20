/*
 * Phase 2B Update 9: coach-selected Monthly Question delivery periods.
 *
 * monthly_questions.question_month/question_year remain temporarily for
 * compatibility but are deprecated and are no longer authoritative.
 */

begin;

do $preflight$
begin
  if to_regclass('public.monthly_questions') is null
    or to_regclass('public.monthly_question_circle_assignments') is null
    or to_regclass('public.content_assignments') is null
  then
    raise exception
      'Monthly Question assignment period preflight failed: required tables are missing';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'monthly_questions'
      and column_name = 'question_month'
  ) or not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'monthly_questions'
      and column_name = 'question_year'
  ) then
    raise exception
      'Monthly Question assignment period preflight failed: compatibility period columns are missing';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and (
        (table_name = 'monthly_questions' and column_name = 'question_number')
        or
        (
          table_name = 'monthly_question_circle_assignments'
          and column_name in ('question_month', 'question_year')
        )
      )
  ) then
    raise exception
      'Monthly Question assignment period preflight failed: a target column already exists';
  end if;
end
$preflight$;

alter table public.monthly_questions
  add column question_number text,
  add constraint monthly_questions_question_number_check
    check (
      question_number is null
      or (
        question_number = btrim(question_number)
        and char_length(question_number) between 1 and 50
      )
    );

alter table public.monthly_question_circle_assignments
  add column question_month smallint,
  add column question_year integer,
  add constraint monthly_question_circle_assignments_question_month_check
    check (question_month is null or question_month between 1 and 12),
  add constraint monthly_question_circle_assignments_question_year_check
    check (question_year is null or question_year between 2020 and 2100),
  add constraint monthly_question_circle_assignments_question_period_pair_check
    check (
      (question_month is null and question_year is null)
      or
      (question_month is not null and question_year is not null)
    );

with unambiguous_active_delivery as (
  select
    mq.id as monthly_question_id,
    min(mqa.id::text)::uuid as assignment_metadata_id,
    mq.question_month,
    mq.question_year
  from public.monthly_questions mq
  join public.monthly_question_circle_assignments mqa
    on mqa.monthly_question_id = mq.id
   and mqa.assignment_status <> 'archived'
  join public.content_assignments ca
    on ca.content_item_id = mq.content_item_id
   and ca.audience_type = 'selected_circle'
   and ca.circle_id = mqa.circle_id
   and ca.assignment_status = 'active'
  where mq.question_month is not null
    and mq.question_year is not null
  group by mq.id, mq.question_month, mq.question_year
  having count(*) = 1
)
update public.monthly_question_circle_assignments mqa
set
  question_month = delivery.question_month,
  question_year = delivery.question_year
from unambiguous_active_delivery delivery
where mqa.id = delivery.assignment_metadata_id;

commit;
