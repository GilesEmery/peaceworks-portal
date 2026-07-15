alter table public.monthly_questions
  add column if not exists category text;

alter table public.monthly_questions
  add column if not exists theme text;

create index if not exists monthly_questions_category_idx
  on public.monthly_questions(category);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  resource_type text not null default 'link',
  provider text,
  external_url text,
  embed_url text,
  storage_path text,
  thumbnail_url text,
  cover_image_path text,
  body_content text,
  source_communication_id uuid,
  file_name text,
  file_size bigint,
  mime_type text,
  category text,
  tags jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resources_status_check check (
    status in ('draft', 'published', 'archived')
  ),
  constraint resources_type_check check (
    resource_type in (
      'link',
      'video',
      'audio',
      'pdf',
      'image',
      'document',
      'worksheet',
      'guide',
      'article',
      'blog',
      'reflection',
      'case_study',
      'downloadable_tool',
      'other'
    )
  ),
  constraint resources_tags_array_check check (
    jsonb_typeof(tags) = 'array'
  )
);

alter table public.resources
  add column if not exists provider text;

alter table public.resources
  add column if not exists embed_url text;

alter table public.resources
  add column if not exists file_name text;

alter table public.resources
  add column if not exists cover_image_path text;

alter table public.resources
  add column if not exists body_content text;

alter table public.resources
  add column if not exists source_communication_id uuid;

alter table public.resources
  add column if not exists file_size bigint;

alter table public.resources
  add column if not exists mime_type text;

alter table public.resources
  drop constraint if exists resources_type_check;

alter table public.resources
  add constraint resources_type_check check (
    resource_type in (
      'link',
      'video',
      'audio',
      'pdf',
      'image',
      'document',
      'worksheet',
      'guide',
      'article',
      'blog',
      'reflection',
      'case_study',
      'downloadable_tool',
      'other'
    )
  );

create index if not exists resources_status_idx
  on public.resources(status);

create index if not exists resources_type_idx
  on public.resources(resource_type);

create index if not exists resources_provider_idx
  on public.resources(provider);

create index if not exists resources_category_idx
  on public.resources(category);

create index if not exists resources_cover_image_idx
  on public.resources(cover_image_path);

create index if not exists resources_source_communication_idx
  on public.resources(source_communication_id);

create index if not exists resources_updated_idx
  on public.resources(updated_at desc);

alter table public.resources enable row level security;

drop policy if exists "resources_service_role_all"
  on public.resources;

create policy "resources_service_role_all"
  on public.resources
  for all
  to service_role
  using (true)
  with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'peaceworks-resources',
  'peaceworks-resources',
  false,
  15728640,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.trainings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cover_image_url text,
  category text,
  estimated_duration text,
  status text not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trainings_status_check check (
    status in ('draft', 'published', 'archived')
  )
);

create index if not exists trainings_status_idx
  on public.trainings(status);

create index if not exists trainings_category_idx
  on public.trainings(category);

create index if not exists trainings_updated_idx
  on public.trainings(updated_at desc);

alter table public.trainings enable row level security;

drop policy if exists "trainings_service_role_all"
  on public.trainings;

create policy "trainings_service_role_all"
  on public.trainings
  for all
  to service_role
  using (true)
  with check (true);

create table if not exists public.communications (
  id uuid primary key default gen_random_uuid(),
  format text not null default 'announcement',
  title text not null,
  subject text,
  preview_text text,
  summary text,
  body_content text,
  communication_type text not null default 'announcement',
  channel text not null default 'dashboard',
  dashboard_presentation text not null default 'standard',
  audience_scope text not null default 'all_members',
  sender_id uuid,
  reply_to_email text,
  visible_author_name text,
  header_image_path text,
  thumbnail_image_path text,
  image_alt_text text,
  category text,
  tags jsonb not null default '[]'::jsonb,
  visible_from timestamptz,
  visible_until timestamptz,
  status text not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint communications_status_check check (
    status in ('draft', 'published', 'archived')
  ),
  constraint communications_format_check check (
    format in (
      'email',
      'blog_article',
      'announcement',
      'newsletter',
      'dashboard_message',
      'circle_update'
    )
  ),
  constraint communications_channel_check check (
    channel in ('dashboard', 'email', 'both')
  ),
  constraint communications_dashboard_presentation_check check (
    dashboard_presentation in ('standard', 'featured', 'banner', 'article')
  ),
  constraint communications_tags_array_check check (
    jsonb_typeof(tags) = 'array'
  )
);

alter table public.communications
  add column if not exists format text not null default 'announcement';

alter table public.communications
  add column if not exists preview_text text;

alter table public.communications
  add column if not exists dashboard_presentation text not null default 'standard';

alter table public.communications
  add column if not exists sender_id uuid;

alter table public.communications
  add column if not exists reply_to_email text;

alter table public.communications
  add column if not exists visible_author_name text;

alter table public.communications
  add column if not exists header_image_path text;

alter table public.communications
  add column if not exists thumbnail_image_path text;

alter table public.communications
  add column if not exists image_alt_text text;

alter table public.communications
  add column if not exists category text;

alter table public.communications
  add column if not exists tags jsonb not null default '[]'::jsonb;

alter table public.communications
  add column if not exists visible_from timestamptz;

alter table public.communications
  add column if not exists visible_until timestamptz;

alter table public.communications
  drop constraint if exists communications_format_check;

alter table public.communications
  add constraint communications_format_check check (
    format in (
      'email',
      'blog_article',
      'announcement',
      'newsletter',
      'dashboard_message',
      'circle_update'
    )
  );

alter table public.communications
  drop constraint if exists communications_dashboard_presentation_check;

alter table public.communications
  add constraint communications_dashboard_presentation_check check (
    dashboard_presentation in ('standard', 'featured', 'banner', 'article')
  );

alter table public.communications
  drop constraint if exists communications_tags_array_check;

alter table public.communications
  add constraint communications_tags_array_check check (
    jsonb_typeof(tags) = 'array'
  );

create index if not exists communications_status_idx
  on public.communications(status);

create index if not exists communications_type_idx
  on public.communications(communication_type);

create index if not exists communications_channel_idx
  on public.communications(channel);

create index if not exists communications_format_idx
  on public.communications(format);

create index if not exists communications_audience_idx
  on public.communications(audience_scope);

create index if not exists communications_sender_idx
  on public.communications(sender_id);

create index if not exists communications_visibility_idx
  on public.communications(visible_from, visible_until);

create index if not exists communications_updated_idx
  on public.communications(updated_at desc);

alter table public.communications enable row level security;

drop policy if exists "communications_service_role_all"
  on public.communications;

create policy "communications_service_role_all"
  on public.communications
  for all
  to service_role
  using (true)
  with check (true);

alter table public.resources
  drop constraint if exists resources_source_communication_id_fkey;

alter table public.resources
  add constraint resources_source_communication_id_fkey
  foreign key (source_communication_id) references public.communications(id)
  on delete set null;

create table if not exists public.communication_senders (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  verified_from_email text not null,
  reply_to_email text not null,
  sender_type text not null default 'person',
  profile_id uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists communication_senders_active_idx
  on public.communication_senders(is_active);

create index if not exists communication_senders_default_idx
  on public.communication_senders(is_default);

alter table public.communication_senders enable row level security;

drop policy if exists "communication_senders_service_role_all"
  on public.communication_senders;

create policy "communication_senders_service_role_all"
  on public.communication_senders
  for all
  to service_role
  using (true)
  with check (true);

alter table public.communications
  drop constraint if exists communications_sender_id_fkey;

alter table public.communications
  add constraint communications_sender_id_fkey
  foreign key (sender_id) references public.communication_senders(id)
  on delete set null;

create table if not exists public.communication_links (
  id uuid primary key default gen_random_uuid(),
  communication_id uuid not null references public.communications(id) on delete cascade,
  label text,
  url text not null,
  link_style text not null default 'text',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint communication_links_style_check check (
    link_style in ('text', 'button', 'featured')
  )
);

create index if not exists communication_links_communication_idx
  on public.communication_links(communication_id);

create index if not exists communication_links_order_idx
  on public.communication_links(communication_id, sort_order);

alter table public.communication_links enable row level security;

drop policy if exists "communication_links_service_role_all"
  on public.communication_links;

create policy "communication_links_service_role_all"
  on public.communication_links
  for all
  to service_role
  using (true)
  with check (true);

create table if not exists public.communication_channels (
  id uuid primary key default gen_random_uuid(),
  communication_id uuid not null references public.communications(id) on delete cascade,
  channel text not null,
  channel_status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(communication_id, channel),
  constraint communication_channels_channel_check check (
    channel in (
      'email',
      'my_dashboard',
      'circle_dashboards',
      'coach_dashboards',
      'admin_internal',
      'resource_library'
    )
  ),
  constraint communication_channels_status_check check (
    channel_status in ('draft', 'active', 'archived')
  )
);

create index if not exists communication_channels_communication_idx
  on public.communication_channels(communication_id);

create index if not exists communication_channels_channel_idx
  on public.communication_channels(channel);

alter table public.communication_channels enable row level security;

drop policy if exists "communication_channels_service_role_all"
  on public.communication_channels;

create policy "communication_channels_service_role_all"
  on public.communication_channels
  for all
  to service_role
  using (true)
  with check (true);

create table if not exists public.communication_audience_targets (
  id uuid primary key default gen_random_uuid(),
  communication_id uuid not null references public.communications(id) on delete cascade,
  audience_type text not null,
  circle_id uuid references public.circles(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint communication_audience_type_check check (
    audience_type in (
      'all_members',
      'all_circle_members',
      'all_coaches',
      'selected_circle',
      'selected_member',
      'selected_coach',
      'admins'
    )
  )
);

create index if not exists communication_audience_targets_communication_idx
  on public.communication_audience_targets(communication_id);

create index if not exists communication_audience_targets_circle_idx
  on public.communication_audience_targets(circle_id);

create index if not exists communication_audience_targets_profile_idx
  on public.communication_audience_targets(profile_id);

alter table public.communication_audience_targets enable row level security;

drop policy if exists "communication_audience_targets_service_role_all"
  on public.communication_audience_targets;

create policy "communication_audience_targets_service_role_all"
  on public.communication_audience_targets
  for all
  to service_role
  using (true)
  with check (true);

create table if not exists public.communication_newsletter_sections (
  id uuid primary key default gen_random_uuid(),
  communication_id uuid not null references public.communications(id) on delete cascade,
  heading text,
  body_content text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists communication_newsletter_sections_communication_idx
  on public.communication_newsletter_sections(communication_id, sort_order);

alter table public.communication_newsletter_sections enable row level security;

drop policy if exists "communication_newsletter_sections_service_role_all"
  on public.communication_newsletter_sections;

create policy "communication_newsletter_sections_service_role_all"
  on public.communication_newsletter_sections
  for all
  to service_role
  using (true)
  with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'peaceworks-communications',
  'peaceworks-communications',
  false,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.content_assignments (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  content_id uuid not null,
  audience_type text not null,
  circle_id uuid references public.circles(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  placement text not null,
  assignment_status text not null default 'active',
  assigned_by uuid references public.profiles(id) on delete set null,
  visible_from timestamptz,
  visible_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_assignments_content_type_check check (
    content_type in ('monthly_question', 'resource', 'training')
  ),
  constraint content_assignments_audience_type_check check (
    audience_type in (
      'coach_library',
      'all_members',
      'all_circle_members',
      'all_coaches',
      'selected_circle',
      'selected_member',
      'selected_coach'
    )
  ),
  constraint content_assignments_placement_check check (
    placement in (
      'my_dashboard',
      'coach_dashboard_library',
      'circle_dashboard',
      'assessments_area',
      'resources_area',
      'trainings_area',
      'featured_dashboard',
      'announcements_area'
    )
  ),
  constraint content_assignments_status_check check (
    assignment_status in ('active', 'archived')
  )
);

create index if not exists content_assignments_content_idx
  on public.content_assignments(content_type, content_id);

create index if not exists content_assignments_audience_idx
  on public.content_assignments(audience_type);

create index if not exists content_assignments_circle_idx
  on public.content_assignments(circle_id);

create index if not exists content_assignments_profile_idx
  on public.content_assignments(profile_id);

create index if not exists content_assignments_status_idx
  on public.content_assignments(assignment_status);

create index if not exists content_assignments_visibility_idx
  on public.content_assignments(visible_from, visible_until);

alter table public.content_assignments enable row level security;

drop policy if exists "content_assignments_service_role_all"
  on public.content_assignments;

create policy "content_assignments_service_role_all"
  on public.content_assignments
  for all
  to service_role
  using (true)
  with check (true);
