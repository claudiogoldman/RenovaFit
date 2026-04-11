create extension if not exists pgcrypto;

create table if not exists public.aluno_strategies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  renovacao_id uuid not null references public.renewal_items(id) on delete cascade,
  aluno_nome text not null,
  strategy_text text not null,
  base_message text,
  source text not null default 'ia' check (source in ('ia', 'manual', 'historico')),
  created_at timestamptz not null default now()
);

create index if not exists aluno_strategies_owner_id_idx on public.aluno_strategies (owner_id);
create index if not exists aluno_strategies_renovacao_id_idx on public.aluno_strategies (renovacao_id);
create index if not exists aluno_strategies_created_at_idx on public.aluno_strategies (created_at desc);

alter table public.historico_contatos
  add column if not exists strategy_id uuid references public.aluno_strategies(id) on delete set null;

create index if not exists historico_contatos_strategy_id_idx on public.historico_contatos (strategy_id);
