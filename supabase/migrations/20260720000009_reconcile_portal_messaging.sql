/*
 * Phase 2B: reconcile portal messaging installations created before
 * conversation-level topics and retry idempotency were finalized.
 *
 * Safe to run when the final schema is already present. This migration does
 * not recreate messaging tables or alter existing messaging data.
 */

begin;

do $$
begin
  if to_regclass('public.conversations') is null
    or to_regclass('public.conversation_participants') is null
    or to_regclass('public.messages') is null then
    raise exception 'Portal messaging reconciliation failed: messaging tables are missing';
  end if;
end
$$;

alter table public.conversations
  add column if not exists creation_key text;

alter table public.messages
  add column if not exists creation_key text;

do $$
begin
  if exists (
    select 1
    from public.conversations
    where title is null
      or char_length(btrim(title)) not between 1 and 150
  ) then
    raise exception 'Portal messaging reconciliation failed: conversation titles must have a trimmed length of 1-150 characters';
  end if;
end
$$;

alter table public.conversations
  alter column title set not null;

alter table public.conversations
  drop constraint if exists conversations_title_check;

alter table public.conversations
  drop constraint if exists conversations_title_length_check;

alter table public.conversations
  add constraint conversations_title_length_check
    check (char_length(btrim(title)) between 1 and 150);

drop index if exists public.conversations_active_admin_support_unique_idx;

create unique index if not exists conversations_creation_retry_unique_idx
  on public.conversations(created_by, creation_key)
  where creation_key is not null;

create unique index if not exists messages_creation_retry_unique_idx
  on public.messages(conversation_id, creation_key)
  where creation_key is not null;

commit;
