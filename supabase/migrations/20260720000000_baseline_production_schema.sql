/*
 * PEACEWORKS PRODUCTION SCHEMA BASELINE
 *
 * This migration is a repository representation of the schema already present
 * in production after the July 2026 read-only metadata audit.
 *
 * It is intended to reconstruct clean development and test databases.
 * DO NOT execute it as ordinary creation SQL against the existing production
 * database. Production already contains these objects. Reconcile production
 * migration history through a separately approved clone rehearsal and then
 * record this migration as applied.
 *
 * Do not run `supabase db reset`, `supabase db push`, or this file against
 * production without an approved rollout and rollback plan. Idempotent clauses
 * below support clean-environment tooling; they do not make production replay
 * safe and must not conceal schema mismatches.
 *
 * No production rows, people, emails, assessment answers, secrets, or
 * environment-specific administrators are included.
 */

-- Foundational identity and relationship tables.
create table public.profiles (
  id uuid primary key,
  first_name text,
  last_name text,
  organization text,
  job_title text,
  timezone text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  account_status text not null default 'active',
  status_changed_at timestamptz not null default now(),
  deactivated_at timestamptz,
  archived_at timestamptz,
  status_changed_by uuid,
  status_reason text,
  constraint profiles_id_fkey
    foreign key (id) references auth.users(id) on delete cascade,
  constraint profiles_account_status_check
    check (account_status in ('active', 'deactivated', 'archived'))
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);

create table public.profile_roles (
  profile_id uuid not null,
  role_id uuid not null,
  assigned_at timestamptz not null default now(),
  primary key (profile_id, role_id)
);

create table public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint circles_name_unique unique (name),
  constraint circles_status_check
    check (status in ('active', 'inactive', 'archived'))
);

create table public.circle_memberships (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null,
  profile_id uuid not null,
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  constraint circle_memberships_status_check
    check (status in ('active', 'inactive', 'completed')),
  constraint circle_membership_dates_valid
    check (ended_at is null or ended_at >= joined_at)
);

create table public.circle_coaches (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null,
  coach_id uuid not null,
  status text not null default 'active',
  assigned_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  constraint circle_coaches_status_check
    check (status in ('active', 'inactive', 'completed')),
  constraint circle_coach_dates_valid
    check (ended_at is null or ended_at >= assigned_at)
);

create table public.coach_assignments (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null,
  member_id uuid not null,
  status text not null default 'active',
  assigned_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  constraint coach_assignments_status_check
    check (status in ('active', 'inactive', 'completed')),
  constraint coach_assignment_dates_valid
    check (ended_at is null or ended_at >= assigned_at)
);

-- Profile and Circle workspaces.
create table public.profile_growth_status (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique,
  process_stage text,
  engagement_status text,
  current_focus text,
  next_step text,
  last_contact_at date,
  next_follow_up_at date,
  growth_summary text,
  support_needs text,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  follow_up_status text not null default 'none',
  follow_up_completed_at timestamptz,
  constraint profile_growth_status_follow_up_status_check
    check (follow_up_status in ('none', 'planned', 'due', 'completed', 'deferred'))
);

create table public.profile_notes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  author_id uuid,
  note_type text not null default 'general',
  body text not null,
  is_private boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  visibility text not null default 'admins',
  constraint profile_notes_visibility_check
    check (visibility in ('admins', 'assigned_coaches', 'circle_coaches'))
);

create table public.circle_notes (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null,
  author_id uuid,
  note_type text not null default 'general',
  body text not null,
  visibility text not null default 'coaches',
  meeting_date date,
  follow_up_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  audience_type text not null default 'internal',
  published_at timestamptz,
  constraint circle_notes_note_type_check check (
    note_type in (
      'general', 'meeting_recap', 'group_dynamics', 'facilitation',
      'follow_up', 'care', 'prayer', 'administrative'
    )
  ),
  constraint circle_notes_visibility_check
    check (visibility in ('coaches', 'admins')),
  constraint circle_notes_audience_type_check
    check (audience_type in ('internal', 'all_circle_members', 'selected_members'))
);

create table public.circle_note_recipients (
  id uuid primary key default gen_random_uuid(),
  circle_note_id uuid not null,
  profile_id uuid not null,
  created_at timestamptz not null default now(),
  unique (circle_note_id, profile_id)
);

create table public.circle_note_links (
  id uuid primary key default gen_random_uuid(),
  circle_note_id uuid not null,
  label text,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Assessments.
create table public.peace_assessment_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  peace_profile text,
  base_pattern text,
  identity_type text,
  response_type text,
  processing_style text,
  capacity_stage text,
  scores jsonb,
  answers jsonb,
  created_at timestamptz default timezone('utc'::text, now()),
  secondary_identity_type text
);

-- Monthly Questions.
create table public.monthly_questions (
  id uuid primary key default gen_random_uuid(),
  title text,
  opening_reflection text,
  question_text text not null,
  guidance text,
  discussion_prompts jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  published_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  category text,
  theme text,
  constraint monthly_questions_status_check
    check (status in ('draft', 'published', 'archived')),
  constraint monthly_questions_discussion_prompts_array_check
    check (jsonb_typeof(discussion_prompts) = 'array')
);

create table public.monthly_question_circle_assignments (
  id uuid primary key default gen_random_uuid(),
  monthly_question_id uuid not null,
  circle_id uuid not null,
  assigned_by uuid,
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  assignment_status text not null default 'active',
  visible_from timestamptz,
  archived_at timestamptz,
  coach_introduction text,
  unique (monthly_question_id, circle_id),
  constraint monthly_question_assignments_status_check
    check (assignment_status in ('active', 'archived'))
);

-- Content source tables.
create table public.communications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text,
  summary text,
  body_content text,
  communication_type text not null default 'announcement',
  channel text not null default 'dashboard',
  audience_scope text not null default 'all_members',
  status text not null default 'draft',
  created_by uuid,
  updated_by uuid,
  published_at timestamptz,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  format text not null default 'announcement',
  preview_text text,
  dashboard_presentation text not null default 'standard',
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
  constraint communications_status_check
    check (status in ('draft', 'published', 'archived')),
  constraint communications_format_check check (
    format in (
      'email', 'blog_article', 'announcement', 'newsletter',
      'dashboard_message', 'circle_update'
    )
  ),
  constraint communications_channel_check
    check (channel in ('dashboard', 'email', 'both')),
  constraint communications_dashboard_presentation_check
    check (dashboard_presentation in ('standard', 'featured', 'banner', 'article')),
  constraint communications_tags_array_check
    check (jsonb_typeof(tags) = 'array')
);

create table public.communication_senders (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  verified_from_email text not null,
  reply_to_email text not null,
  sender_type text not null default 'person',
  profile_id uuid,
  is_active boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.communication_links (
  id uuid primary key default gen_random_uuid(),
  communication_id uuid not null,
  label text,
  url text not null,
  link_style text not null default 'text',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint communication_links_style_check
    check (link_style in ('text', 'button', 'featured'))
);

create table public.communication_channels (
  id uuid primary key default gen_random_uuid(),
  communication_id uuid not null,
  channel text not null,
  channel_status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (communication_id, channel),
  constraint communication_channels_channel_check check (
    channel in (
      'email', 'my_dashboard', 'circle_dashboards', 'coach_dashboards',
      'admin_internal', 'resource_library'
    )
  ),
  constraint communication_channels_status_check
    check (channel_status in ('draft', 'active', 'archived'))
);

create table public.communication_audience_targets (
  id uuid primary key default gen_random_uuid(),
  communication_id uuid not null,
  audience_type text not null,
  circle_id uuid,
  profile_id uuid,
  created_at timestamptz not null default now(),
  constraint communication_audience_type_check check (
    audience_type in (
      'all_members', 'all_circle_members', 'all_coaches', 'selected_circle',
      'selected_member', 'selected_coach', 'admins'
    )
  )
);

create table public.communication_newsletter_sections (
  id uuid primary key default gen_random_uuid(),
  communication_id uuid not null,
  heading text,
  body_content text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  resource_type text not null default 'link',
  external_url text,
  storage_path text,
  thumbnail_url text,
  category text,
  tags jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  created_by uuid,
  updated_by uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  provider text,
  embed_url text,
  file_name text,
  file_size bigint,
  mime_type text,
  cover_image_path text,
  body_content text,
  source_communication_id uuid,
  constraint resources_status_check
    check (status in ('draft', 'published', 'archived')),
  constraint resources_type_check check (
    resource_type in (
      'link', 'video', 'audio', 'pdf', 'image', 'document', 'worksheet',
      'guide', 'article', 'blog', 'reflection', 'case_study',
      'downloadable_tool', 'other'
    )
  ),
  constraint resources_tags_array_check
    check (jsonb_typeof(tags) = 'array')
);

create table public.trainings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cover_image_url text,
  category text,
  estimated_duration text,
  status text not null default 'draft',
  created_by uuid,
  updated_by uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trainings_status_check
    check (status in ('draft', 'published', 'archived'))
);

create table public.content_assignments (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  content_id uuid not null,
  audience_type text not null,
  circle_id uuid,
  profile_id uuid,
  placement text not null,
  assignment_status text not null default 'active',
  assigned_by uuid,
  visible_from timestamptz,
  visible_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_assignments_content_type_check
    check (content_type in ('monthly_question', 'resource', 'training')),
  constraint content_assignments_audience_type_check check (
    audience_type in (
      'coach_library', 'all_members', 'all_circle_members', 'all_coaches',
      'selected_circle', 'selected_member', 'selected_coach'
    )
  ),
  constraint content_assignments_placement_check check (
    placement in (
      'my_dashboard', 'coach_dashboard_library', 'circle_dashboard',
      'assessments_area', 'resources_area', 'trainings_area',
      'featured_dashboard', 'announcements_area'
    )
  ),
  constraint content_assignments_status_check
    check (assignment_status in ('active', 'archived'))
);

create table public.portal_waitlist (
  id bigint primary key,
  created_at timestamptz not null default now(),
  name text,
  email text,
  organization text
);

-- Verified foreign keys and production deletion actions.
alter table public.profiles
  add constraint profiles_status_changed_by_fkey
  foreign key (status_changed_by) references public.profiles(id) on delete set null;
alter table public.profile_roles
  add constraint profile_roles_profile_id_fkey
  foreign key (profile_id) references public.profiles(id) on delete cascade,
  add constraint profile_roles_role_id_fkey
  foreign key (role_id) references public.roles(id) on delete cascade;
alter table public.circle_memberships
  add constraint circle_memberships_circle_id_fkey
  foreign key (circle_id) references public.circles(id) on delete cascade,
  add constraint circle_memberships_profile_id_fkey
  foreign key (profile_id) references public.profiles(id) on delete cascade;
alter table public.circle_coaches
  add constraint circle_coaches_circle_id_fkey
  foreign key (circle_id) references public.circles(id) on delete cascade,
  add constraint circle_coaches_coach_id_fkey
  foreign key (coach_id) references public.profiles(id) on delete cascade;
alter table public.coach_assignments
  add constraint coach_assignments_coach_id_fkey
  foreign key (coach_id) references public.profiles(id) on delete cascade,
  add constraint coach_assignments_member_id_fkey
  foreign key (member_id) references public.profiles(id) on delete cascade;
alter table public.profile_growth_status
  add constraint profile_growth_status_profile_id_fkey
  foreign key (profile_id) references public.profiles(id) on delete cascade,
  add constraint profile_growth_status_updated_by_fkey
  foreign key (updated_by) references public.profiles(id) on delete set null;
alter table public.profile_notes
  add constraint profile_notes_profile_id_fkey
  foreign key (profile_id) references public.profiles(id) on delete cascade,
  add constraint profile_notes_author_id_fkey
  foreign key (author_id) references public.profiles(id) on delete set null;
alter table public.circle_notes
  add constraint circle_notes_circle_id_fkey
  foreign key (circle_id) references public.circles(id) on delete cascade,
  add constraint circle_notes_author_id_fkey
  foreign key (author_id) references public.profiles(id) on delete set null;
alter table public.circle_note_recipients
  add constraint circle_note_recipients_circle_note_id_fkey
  foreign key (circle_note_id) references public.circle_notes(id) on delete cascade,
  add constraint circle_note_recipients_profile_id_fkey
  foreign key (profile_id) references public.profiles(id) on delete cascade;
alter table public.circle_note_links
  add constraint circle_note_links_circle_note_id_fkey
  foreign key (circle_note_id) references public.circle_notes(id) on delete cascade;
alter table public.peace_assessment_results
  add constraint peace_assessment_results_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.monthly_questions
  add constraint monthly_questions_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null,
  add constraint monthly_questions_updated_by_fkey
  foreign key (updated_by) references public.profiles(id) on delete set null;
alter table public.monthly_question_circle_assignments
  add constraint monthly_question_circle_assignments_monthly_question_id_fkey
  foreign key (monthly_question_id) references public.monthly_questions(id) on delete cascade,
  add constraint monthly_question_circle_assignments_circle_id_fkey
  foreign key (circle_id) references public.circles(id) on delete cascade,
  add constraint monthly_question_circle_assignments_assigned_by_fkey
  foreign key (assigned_by) references public.profiles(id) on delete set null;
alter table public.communication_senders
  add constraint communication_senders_profile_id_fkey
  foreign key (profile_id) references public.profiles(id) on delete set null;
alter table public.communications
  add constraint communications_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null,
  add constraint communications_updated_by_fkey
  foreign key (updated_by) references public.profiles(id) on delete set null,
  add constraint communications_sender_id_fkey
  foreign key (sender_id) references public.communication_senders(id) on delete set null;
alter table public.communication_links
  add constraint communication_links_communication_id_fkey
  foreign key (communication_id) references public.communications(id) on delete cascade;
alter table public.communication_channels
  add constraint communication_channels_communication_id_fkey
  foreign key (communication_id) references public.communications(id) on delete cascade;
alter table public.communication_audience_targets
  add constraint communication_audience_targets_communication_id_fkey
  foreign key (communication_id) references public.communications(id) on delete cascade,
  add constraint communication_audience_targets_circle_id_fkey
  foreign key (circle_id) references public.circles(id) on delete cascade,
  add constraint communication_audience_targets_profile_id_fkey
  foreign key (profile_id) references public.profiles(id) on delete cascade;
alter table public.communication_newsletter_sections
  add constraint communication_newsletter_sections_communication_id_fkey
  foreign key (communication_id) references public.communications(id) on delete cascade;
alter table public.resources
  add constraint resources_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null,
  add constraint resources_updated_by_fkey
  foreign key (updated_by) references public.profiles(id) on delete set null,
  add constraint resources_source_communication_id_fkey
  foreign key (source_communication_id) references public.communications(id) on delete set null;
alter table public.trainings
  add constraint trainings_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null,
  add constraint trainings_updated_by_fkey
  foreign key (updated_by) references public.profiles(id) on delete set null;
alter table public.content_assignments
  add constraint content_assignments_circle_id_fkey
  foreign key (circle_id) references public.circles(id) on delete cascade,
  add constraint content_assignments_profile_id_fkey
  foreign key (profile_id) references public.profiles(id) on delete cascade,
  add constraint content_assignments_assigned_by_fkey
  foreign key (assigned_by) references public.profiles(id) on delete set null;

-- Verified non-constraint indexes.
create index profiles_account_status_idx on public.profiles(account_status);
create index profile_roles_profile_id_idx on public.profile_roles(profile_id);
create index profile_roles_role_id_idx on public.profile_roles(role_id);
create index circle_memberships_circle_id_idx on public.circle_memberships(circle_id);
create index circle_memberships_profile_id_idx on public.circle_memberships(profile_id);
create unique index one_active_membership_per_circle
  on public.circle_memberships(circle_id, profile_id) where status = 'active';
create index circle_coaches_circle_id_idx on public.circle_coaches(circle_id);
create index circle_coaches_coach_id_idx on public.circle_coaches(coach_id);
create unique index one_active_circle_coach_assignment
  on public.circle_coaches(circle_id, coach_id) where status = 'active';
create index coach_assignments_coach_id_idx on public.coach_assignments(coach_id);
create index coach_assignments_member_id_idx on public.coach_assignments(member_id);
create unique index one_active_coach_member_assignment
  on public.coach_assignments(coach_id, member_id) where status = 'active';
create index profile_notes_profile_created_idx
  on public.profile_notes(profile_id, created_at desc);
create index profile_notes_visibility_idx on public.profile_notes(visibility);
create index circle_notes_circle_created_idx
  on public.circle_notes(circle_id, created_at desc);
create index circle_notes_author_idx on public.circle_notes(author_id);
create index circle_notes_type_idx on public.circle_notes(note_type);
create index circle_notes_audience_idx on public.circle_notes(audience_type);
create index circle_note_recipients_note_idx
  on public.circle_note_recipients(circle_note_id);
create index circle_note_recipients_profile_idx
  on public.circle_note_recipients(profile_id);
create index circle_note_links_note_idx on public.circle_note_links(circle_note_id);
create index circle_note_links_note_order_idx
  on public.circle_note_links(circle_note_id, sort_order);
create index monthly_questions_status_idx on public.monthly_questions(status);
create index monthly_questions_published_idx
  on public.monthly_questions(published_at desc);
create index monthly_questions_created_by_idx on public.monthly_questions(created_by);
create index monthly_questions_updated_idx
  on public.monthly_questions(updated_at desc);
create index monthly_questions_category_idx on public.monthly_questions(category);
create index monthly_question_assignments_question_idx
  on public.monthly_question_circle_assignments(monthly_question_id);
create index monthly_question_assignments_circle_idx
  on public.monthly_question_circle_assignments(circle_id);
create index monthly_question_assignments_circle_question_idx
  on public.monthly_question_circle_assignments(circle_id, monthly_question_id);
create index monthly_question_assignments_status_idx
  on public.monthly_question_circle_assignments(assignment_status);
create index monthly_question_assignments_visible_idx
  on public.monthly_question_circle_assignments(visible_from);
create index communication_senders_active_idx
  on public.communication_senders(is_active);
create index communication_senders_default_idx
  on public.communication_senders(is_default);
create index communications_status_idx on public.communications(status);
create index communications_type_idx on public.communications(communication_type);
create index communications_channel_idx on public.communications(channel);
create index communications_format_idx on public.communications(format);
create index communications_audience_idx on public.communications(audience_scope);
create index communications_sender_idx on public.communications(sender_id);
create index communications_visibility_idx
  on public.communications(visible_from, visible_until);
create index communications_updated_idx on public.communications(updated_at desc);
create index communication_links_communication_idx
  on public.communication_links(communication_id);
create index communication_links_order_idx
  on public.communication_links(communication_id, sort_order);
create index communication_channels_communication_idx
  on public.communication_channels(communication_id);
create index communication_channels_channel_idx
  on public.communication_channels(channel);
create index communication_audience_targets_communication_idx
  on public.communication_audience_targets(communication_id);
create index communication_audience_targets_circle_idx
  on public.communication_audience_targets(circle_id);
create index communication_audience_targets_profile_idx
  on public.communication_audience_targets(profile_id);
create index communication_newsletter_sections_communication_idx
  on public.communication_newsletter_sections(communication_id, sort_order);
create index resources_status_idx on public.resources(status);
create index resources_type_idx on public.resources(resource_type);
create index resources_provider_idx on public.resources(provider);
create index resources_category_idx on public.resources(category);
create index resources_cover_image_idx on public.resources(cover_image_path);
create index resources_source_communication_idx
  on public.resources(source_communication_id);
create index resources_updated_idx on public.resources(updated_at desc);
create index trainings_status_idx on public.trainings(status);
create index trainings_category_idx on public.trainings(category);
create index trainings_updated_idx on public.trainings(updated_at desc);
create index content_assignments_content_idx
  on public.content_assignments(content_type, content_id);
create index content_assignments_audience_idx
  on public.content_assignments(audience_type);
create index content_assignments_circle_idx on public.content_assignments(circle_id);
create index content_assignments_profile_idx on public.content_assignments(profile_id);
create index content_assignments_status_idx
  on public.content_assignments(assignment_status);
create index content_assignments_visibility_idx
  on public.content_assignments(visible_from, visible_until);

-- Verified functions and triggers.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  )
  on conflict (id) do nothing;

  return new;
end;
$function$;

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_profile_updated_at();

-- RLS is enabled on every verified public table.
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.profile_roles enable row level security;
alter table public.circles enable row level security;
alter table public.circle_memberships enable row level security;
alter table public.circle_coaches enable row level security;
alter table public.coach_assignments enable row level security;
alter table public.profile_growth_status enable row level security;
alter table public.profile_notes enable row level security;
alter table public.circle_notes enable row level security;
alter table public.circle_note_recipients enable row level security;
alter table public.circle_note_links enable row level security;
alter table public.peace_assessment_results enable row level security;
alter table public.monthly_questions enable row level security;
alter table public.monthly_question_circle_assignments enable row level security;
alter table public.resources enable row level security;
alter table public.trainings enable row level security;
alter table public.content_assignments enable row level security;
alter table public.communications enable row level security;
alter table public.communication_senders enable row level security;
alter table public.communication_channels enable row level security;
alter table public.communication_audience_targets enable row level security;
alter table public.communication_links enable row level security;
alter table public.communication_newsletter_sections enable row level security;
alter table public.portal_waitlist enable row level security;

-- Verified end-user policies.
create policy "Users can view their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "Users can create their own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy "Allow authenticated inserts"
  on public.peace_assessment_results for insert to public
  with check (auth.uid() = user_id);
create policy "Allow users to view their own results"
  on public.peace_assessment_results for select to public
  using (auth.uid() = user_id);
create policy "Allow public waitlist inserts"
  on public.portal_waitlist for insert to public
  with check (true);

-- Verified service-role-only policies for server-mediated tables.
create policy "profile_growth_status_service_role_all"
  on public.profile_growth_status for all to service_role using (true) with check (true);
create policy "profile_notes_service_role_all"
  on public.profile_notes for all to service_role using (true) with check (true);
create policy "circle_notes_service_role_all"
  on public.circle_notes for all to service_role using (true) with check (true);
create policy "circle_note_recipients_service_role_all"
  on public.circle_note_recipients for all to service_role using (true) with check (true);
create policy "circle_note_links_service_role_all"
  on public.circle_note_links for all to service_role using (true) with check (true);
create policy "monthly_questions_service_role_all"
  on public.monthly_questions for all to service_role using (true) with check (true);
create policy "monthly_question_assignments_service_role_all"
  on public.monthly_question_circle_assignments
  for all to service_role using (true) with check (true);
create policy "resources_service_role_all"
  on public.resources for all to service_role using (true) with check (true);
create policy "trainings_service_role_all"
  on public.trainings for all to service_role using (true) with check (true);
create policy "content_assignments_service_role_all"
  on public.content_assignments for all to service_role using (true) with check (true);
create policy "communications_service_role_all"
  on public.communications for all to service_role using (true) with check (true);
create policy "communication_senders_service_role_all"
  on public.communication_senders for all to service_role using (true) with check (true);
create policy "communication_channels_service_role_all"
  on public.communication_channels for all to service_role using (true) with check (true);
create policy "communication_audience_targets_service_role_all"
  on public.communication_audience_targets
  for all to service_role using (true) with check (true);
create policy "communication_links_service_role_all"
  on public.communication_links for all to service_role using (true) with check (true);
create policy "communication_newsletter_sections_service_role_all"
  on public.communication_newsletter_sections
  for all to service_role using (true) with check (true);

-- roles, profile_roles, circles, circle_memberships, circle_coaches, and
-- coach_assignments intentionally have RLS enabled with no policies.

-- Verified broad table grants. RLS remains the row-access boundary.
grant all privileges on all tables in schema public
  to anon, authenticated, service_role, postgres;

-- Stable role definitions only. No people or environment-specific grants.
insert into public.roles (name, label)
values
  ('member', 'Member'),
  ('circle_member', 'Circle Member'),
  ('coach', 'Coach'),
  ('project_manager', 'Project Manager'),
  ('admin', 'Admin')
on conflict (name) do update set label = excluded.label;

-- Verified private buckets. Production currently has no storage.objects RLS
-- policies; none are invented here. Storage remains server-mediated.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
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
  ),
  (
    'peaceworks-communications',
    'peaceworks-communications',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
