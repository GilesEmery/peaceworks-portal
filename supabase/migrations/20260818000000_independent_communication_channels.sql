/* Independent email/site delivery state and auditable external email delivery. */

alter table public.communication_channels
  drop constraint if exists communication_channels_status_check;

alter table public.communication_channels
  add constraint communication_channels_status_check
  check (channel_status in ('draft', 'active', 'sent', 'failed', 'archived'));

create table if not exists public.communication_external_recipients (
  id uuid primary key default gen_random_uuid(),
  communication_id uuid not null references public.communications(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  unique (communication_id, email),
  constraint communication_external_recipient_email_check
    check (email = lower(btrim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
);

create table if not exists public.communication_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  communication_id uuid not null references public.communications(id) on delete cascade,
  recipient_email text not null,
  provider_message_id text,
  delivery_status text not null,
  subject_snapshot text not null,
  body_text_snapshot text not null,
  body_html_snapshot text not null,
  error_message text,
  sent_at timestamptz not null default now(),
  constraint communication_email_delivery_status_check
    check (delivery_status in ('accepted', 'failed'))
);

create index if not exists communication_external_recipients_communication_idx
  on public.communication_external_recipients(communication_id);
create index if not exists communication_email_deliveries_communication_idx
  on public.communication_email_deliveries(communication_id, sent_at desc);

alter table public.communication_external_recipients enable row level security;
alter table public.communication_email_deliveries enable row level security;

create policy "communication_external_recipients_service_role_all"
  on public.communication_external_recipients for all to service_role using (true) with check (true);
create policy "communication_email_deliveries_service_role_all"
  on public.communication_email_deliveries for all to service_role using (true) with check (true);
