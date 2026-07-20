/*
 * Phase 2B Update 8: Monthly Question period.
 *
 * Existing rows remain nullable and no period is inferred from timestamps.
 */

begin;

do $preflight$
begin
  if to_regclass('public.monthly_questions') is null then
    raise exception
      'Monthly Question period preflight failed: monthly_questions is missing';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'monthly_questions'
      and column_name in ('question_month', 'question_year')
  ) then
    raise exception
      'Monthly Question period preflight failed: a period column already exists';
  end if;
end
$preflight$;

alter table public.monthly_questions
  add column question_month smallint,
  add column question_year integer,
  add constraint monthly_questions_question_month_check
    check (question_month is null or question_month between 1 and 12),
  add constraint monthly_questions_question_year_check
    check (question_year is null or question_year between 2020 and 2100),
  add constraint monthly_questions_question_period_pair_check
    check (
      (question_month is null and question_year is null)
      or
      (question_month is not null and question_year is not null)
    );

commit;
