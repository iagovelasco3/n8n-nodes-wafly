-- Apply ONLY in your own test project's database after review.
-- No phone, message, credentials or contacts are stored here.
create table public.wafly_builder_first_attempts (
  owner_id uuid primary key references auth.users(id),
  state text not null check (state in ('reserved','accepted','rejected','uncertain','duplicate_blocked')),
  provider_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.wafly_builder_first_attempts enable row level security;
revoke all on table public.wafly_builder_first_attempts from public, anon, authenticated;
revoke all on table public.wafly_builder_first_attempts from service_role;
grant select, insert, update on table public.wafly_builder_first_attempts to service_role;
comment on table public.wafly_builder_first_attempts is
  'First manual owner-only test. One persistent reservation; never delete an uncertain attempt to retry.';
