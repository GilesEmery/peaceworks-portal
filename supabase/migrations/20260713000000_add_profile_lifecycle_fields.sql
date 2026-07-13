alter table public.profiles
  add column if not exists account_status text not null default 'active',
  add column if not exists status_changed_at timestamptz not null default now(),
  add column if not exists deactivated_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists status_changed_by uuid references public.profiles(id) on delete set null,
  add column if not exists status_reason text;

do $$
begin
  alter table public.profiles
    add constraint profiles_account_status_check
    check (account_status in ('active', 'deactivated', 'archived'));
exception
  when duplicate_object then null;
end $$;

update public.profiles
set account_status = 'active'
where account_status is null;

create index if not exists profiles_account_status_idx
  on public.profiles(account_status);
