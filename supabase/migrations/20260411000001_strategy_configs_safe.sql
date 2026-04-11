-- Safe migration to ensure strategy_configs exists in environments where
-- older migrations were not applied.

create extension if not exists pgcrypto;

create table if not exists public.strategy_configs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  branch_id uuid references public.branches(id),

  section_resumo boolean not null default true,
  section_mensagens boolean not null default true,
  section_objecoes boolean not null default true,
  section_proximo_passo boolean not null default true,
  section_gatilhos boolean not null default false,
  section_historico boolean not null default true,

  msg_primeira_abordagem boolean not null default true,
  msg_followup boolean not null default true,
  msg_direta boolean not null default true,
  msg_consultiva boolean not null default true,

  obj_preco boolean not null default true,
  obj_tempo boolean not null default true,
  obj_motivacao boolean not null default true,
  obj_concorrencia boolean not null default false,
  obj_saude boolean not null default false,

  tom text not null default 'equilibrado' check (tom in ('executivo', 'consultivo', 'equilibrado')),
  contexto_adicional text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists strategy_configs_profile_id_idx
  on public.strategy_configs(profile_id);

alter table public.strategy_configs enable row level security;

drop policy if exists "usuario gerencia proprio config" on public.strategy_configs;
create policy "usuario gerencia proprio config"
  on public.strategy_configs for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists "super_admin ve todos configs" on public.strategy_configs;
create policy "super_admin ve todos configs"
  on public.strategy_configs for all
  using (public.get_my_role() = 'super_admin')
  with check (public.get_my_role() = 'super_admin');
