/*
 * Phase 2B: secure portal conversations.
 * Additive only. Existing communications remain the outbound authoring record.
 */

begin;

do $$
begin
  if to_regclass('public.profiles') is null
    or to_regclass('public.circles') is null
    or to_regclass('public.communications') is null then
    raise exception 'Portal messaging preflight failed: foundational tables are missing';
  end if;
end
$$;

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_type text not null,
  title text not null,
  circle_id uuid,
  support_profile_id uuid,
  created_by uuid,
  creation_key text,
  source_communication_id uuid,
  is_announcement boolean not null default false,
  replies_enabled boolean not null default true,
  status text not null default 'active',
  visible_from timestamptz,
  visible_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_type_check
    check (conversation_type in ('direct', 'group', 'circle', 'announcement', 'admin_support')),
  constraint conversations_status_check check (status in ('active', 'archived')),
  constraint conversations_visibility_window_check
    check (visible_until is null or visible_from is null or visible_until > visible_from),
  constraint conversations_title_length_check
    check (char_length(btrim(title)) between 1 and 150),
  constraint conversations_circle_shape_check
    check (
      (conversation_type = 'circle' and circle_id is not null)
      or conversation_type = 'group'
      or (conversation_type not in ('circle', 'group') and circle_id is null)
    ),
  constraint conversations_support_shape_check
    check (
      (conversation_type = 'admin_support' and support_profile_id is not null)
      or (conversation_type <> 'admin_support' and support_profile_id is null)
    ),
  constraint conversations_announcement_shape_check
    check (
      (conversation_type = 'announcement' and is_announcement)
      or (conversation_type <> 'announcement' and not is_announcement)
    ),
  constraint conversations_circle_id_fkey
    foreign key (circle_id) references public.circles(id) on delete restrict,
  constraint conversations_support_profile_id_fkey
    foreign key (support_profile_id) references public.profiles(id) on delete restrict,
  constraint conversations_created_by_fkey
    foreign key (created_by) references public.profiles(id) on delete set null,
  constraint conversations_source_communication_id_fkey
    foreign key (source_communication_id) references public.communications(id) on delete set null
);

create table public.conversation_participants (
  conversation_id uuid not null,
  profile_id uuid not null,
  participant_role text not null default 'member',
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  last_read_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz,
  primary key (conversation_id, profile_id),
  constraint conversation_participants_role_check
    check (participant_role in ('owner', 'moderator', 'member')),
  constraint conversation_participants_left_at_check
    check (left_at is null or left_at >= joined_at),
  constraint conversation_participants_archive_delete_check
    check (deleted_at is null or archived_at is null or deleted_at >= archived_at),
  constraint conversation_participants_conversation_id_fkey
    foreign key (conversation_id) references public.conversations(id) on delete cascade,
  constraint conversation_participants_profile_id_fkey
    foreign key (profile_id) references public.profiles(id) on delete restrict
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  sender_profile_id uuid,
  creation_key text,
  body text not null,
  created_at timestamptz not null default now(),
  constraint messages_body_check
    check (char_length(btrim(body)) between 1 and 10000),
  constraint messages_conversation_id_fkey
    foreign key (conversation_id) references public.conversations(id) on delete restrict,
  constraint messages_sender_profile_id_fkey
    foreign key (sender_profile_id) references public.profiles(id) on delete set null
);

create unique index conversations_active_circle_unique_idx
  on public.conversations(circle_id)
  where conversation_type = 'circle' and status = 'active';
create unique index conversations_source_communication_unique_idx
  on public.conversations(source_communication_id)
  where source_communication_id is not null;
create unique index conversations_creation_retry_unique_idx
  on public.conversations(created_by, creation_key)
  where creation_key is not null;
create index conversations_circle_idx on public.conversations(circle_id);
create index conversations_type_status_idx
  on public.conversations(conversation_type, status, updated_at desc);
create index conversations_visibility_idx
  on public.conversations(visible_from, visible_until);
create index conversation_participants_inbox_idx
  on public.conversation_participants(profile_id, archived_at, deleted_at, left_at);
create index conversation_participants_authorization_idx
  on public.conversation_participants(conversation_id, profile_id)
  where left_at is null;
create index conversation_participants_unread_idx
  on public.conversation_participants(profile_id, last_read_at)
  where left_at is null and deleted_at is null;
create index messages_conversation_created_idx
  on public.messages(conversation_id, created_at desc, id desc);
create unique index messages_creation_retry_unique_idx
  on public.messages(conversation_id, creation_key)
  where creation_key is not null;

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

revoke all on table public.conversations from anon, authenticated;
revoke all on table public.conversation_participants from anon, authenticated;
revoke all on table public.messages from anon, authenticated;
grant all on table public.conversations to service_role;
grant all on table public.conversation_participants to service_role;
grant all on table public.messages to service_role;

create policy "conversations_service_role_all"
  on public.conversations for all to service_role using (true) with check (true);
create policy "conversation_participants_service_role_all"
  on public.conversation_participants for all to service_role using (true) with check (true);
create policy "messages_service_role_all"
  on public.messages for all to service_role using (true) with check (true);

commit;
