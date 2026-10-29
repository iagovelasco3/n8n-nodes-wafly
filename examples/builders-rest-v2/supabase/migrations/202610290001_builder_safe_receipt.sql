-- Additive v2 migration: apply AFTER the original v1 migration.
-- Preserve the table and every existing reservation. No raw text/phone/credential stored.
alter table public.wafly_builder_first_attempts
  add column operation_key uuid,
  add column request_hash text check (request_hash ~ '^[a-f0-9]{64}$'),
  add column scope_hash text check (scope_hash ~ '^[a-f0-9]{64}$'),
  add column expires_at timestamptz;

create function public.wafly_builder_preserve_intent_v2() returns trigger
language plpgsql set search_path = pg_catalog as $$
begin
  if new.owner_id is distinct from old.owner_id
    or new.created_at is distinct from old.created_at
    or new.operation_key is distinct from old.operation_key
    or new.request_hash is distinct from old.request_hash
    or new.scope_hash is distinct from old.scope_hash
    or (old.provider_message_id is not null and new.provider_message_id is distinct from old.provider_message_id)
    or (old.expires_at is not null and new.expires_at is distinct from old.expires_at)
  then raise exception 'Original intent is immutable; reconcile instead of resetting it'; end if;
  return new;
end; $$;
create trigger wafly_builder_preserve_intent_v2 before update
on public.wafly_builder_first_attempts for each row
execute function public.wafly_builder_preserve_intent_v2();

-- Original RLS and select/insert/update-only service_role grants remain.
-- Legacy rows retain NULL keys: v2 refuses to resend them or invent recovery evidence.
