-- Configurações de estratégia por usuário (salvas por profile)
create table public.strategy_configs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  branch_id uuid references public.branches(id),

  -- Seções ativas (quais blocos a IA deve gerar)
  section_resumo boolean default true,
  section_mensagens boolean default true,
  section_objecoes boolean default true,
  section_proximo_passo boolean default true,
  section_gatilhos boolean default false,
  section_historico boolean default true,

  -- Tipos de mensagens
  msg_primeira_abordagem boolean default true,
  msg_followup boolean default true,
  msg_direta boolean default true,
  msg_consultiva boolean default true,

  -- Tipos de objeções
  obj_preco boolean default true,
  obj_tempo boolean default true,
  obj_motivacao boolean default true,
  obj_concorrencia boolean default false,
  obj_saude boolean default false,

  -- Tom da estratégia
  tom text default 'equilibrado' check (tom in ('executivo', 'consultivo', 'equilibrado')),

  -- Texto livre com sugestões/contexto adicional
  contexto_adicional text,

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Apenas um config por usuário
create unique index on public.strategy_configs(profile_id);

-- RLS
alter table public.strategy_configs enable row level security;

create policy "usuario gerencia proprio config"
  on public.strategy_configs for all
  using (profile_id = auth.uid());

create policy "super_admin ve todos configs"
  on public.strategy_configs for all
  using (get_my_role() = 'super_admin');
