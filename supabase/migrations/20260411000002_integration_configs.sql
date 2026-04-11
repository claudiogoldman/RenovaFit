-- User-level integration settings for IA and WhatsApp providers.

create extension if not exists pgcrypto;

create table if not exists public.integration_configs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,

  active_provider text not null default 'gemini' check (active_provider in ('gemini', 'openrouter')),

  gemini_api_key text,
  openrouter_api_key text,
  openrouter_model text not null default 'openrouter/free',

  whatsapp_access_token text,
  whatsapp_phone_number_id text,
  whatsapp_business_account_id text,
  whatsapp_verify_token text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists integration_configs_profile_id_idx
  on public.integration_configs(profile_id);

alter table public.integration_configs enable row level security;

drop policy if exists "usuario gerencia propria integration_config" on public.integration_configs;
create policy "usuario gerencia propria integration_config"
  on public.integration_configs for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists "super_admin ve integration_configs" on public.integration_configs;
create policy "super_admin ve integration_configs"
  on public.integration_configs for all
  using (public.get_my_role() = 'super_admin')
  with check (public.get_my_role() = 'super_admin');
