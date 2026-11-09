-- PDF flipbooks use existing resource assignments and private PDF storage.
-- Display style is an opt-in property of ordinary PDF resources.
alter table public.resources
  add column if not exists display_as_flipbook boolean not null default false;
