create extension if not exists pgcrypto;

create table if not exists public.renewal_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  telefone text,
  plan text not null,
  status text not null check (status in ('ativo', 'sumido', 'critico', 'renovado')),
  renewal_date date,
  last_contact text,
  owner text not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.renewal_items add column if not exists telefone text;
alter table public.renewal_items add column if not exists owner_id uuid;

-- Compatibilidade com versao antiga que usava a coluna phone.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'renewal_items'
      and column_name = 'phone'
  ) then
    execute 'update public.renewal_items set telefone = coalesce(telefone, phone)';
  end if;
end $$;

update public.renewal_items
set owner_id = '00000000-0000-0000-0000-000000000000'
where owner_id is null;

alter table public.renewal_items alter column owner_id set not null;
alter table public.renewal_items alter column owner set not null;

create index if not exists renewal_items_created_at_idx on public.renewal_items (created_at desc);
create index if not exists renewal_items_status_idx on public.renewal_items (status);
create index if not exists renewal_items_plan_idx on public.renewal_items (plan);
create index if not exists renewal_items_owner_id_idx on public.renewal_items (owner_id);

create table if not exists public.historico_contatos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  renovacao_id uuid not null references public.renewal_items(id) on delete cascade,
  aluno_nome text not null,
  canal text not null check (canal in ('whatsapp', 'telefone', 'manual')),
  tipo_contato text not null check (tipo_contato in ('primeiro_contato', 'followup', 'resposta', 'observacao')),
  telefone text,
  mensagem text not null,
  status_envio text not null check (status_envio in ('pendente', 'enviado', 'erro', 'manual')),
  erro_detalhe text,
  owner text,
  created_at timestamptz not null default now()
);

create index if not exists historico_contatos_owner_id_idx on public.historico_contatos (owner_id);
create index if not exists historico_contatos_renovacao_id_idx on public.historico_contatos (renovacao_id);
create index if not exists historico_contatos_created_at_idx on public.historico_contatos (created_at desc);
