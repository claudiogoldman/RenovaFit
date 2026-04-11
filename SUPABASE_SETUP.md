# Supabase Setup - Lista de Renovacao

## 1) Variaveis no Vercel

Adicione no projeto:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL` (producao: `https://renovafit.vercel.app`)

## 1.1) Configuracao de Auth no Supabase Dashboard

No painel do Supabase, abra `Authentication > URL Configuration` e configure:

- `Site URL`: `https://renovafit.vercel.app`
- `Redirect URLs`:
  - `https://renovafit.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

Sem esses valores, o link de confirmacao por e-mail pode redirecionar para localhost em producao.

## 2) Rodar SQL no Supabase (SQL Editor)

```sql
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

-- Compatibilidade com versao anterior que usava "phone"
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
```

## 2.1) Correcao do erro strategy_configs ausente

Se aparecer o erro `Could not find the table 'public.strategy_configs' in the schema cache`, execute tambem o SQL da migration:

- `supabase/migrations/20260411000001_strategy_configs_safe.sql`

Essa migration cria a tabela `public.strategy_configs` (configuracao por usuario), indice unico por `profile_id` e politicas RLS.

## 2.2) Integracoes por usuario (IA e WhatsApp)

Para habilitar a tela de integracoes em `/admin/configuracoes`, execute tambem:

- `supabase/migrations/20260411000002_integration_configs.sql`

Essa migration cria `public.integration_configs` com configuracao por usuario para:
- Provedor de IA ativo (Gemini/OpenRouter)
- Chaves de IA
- Tokens/IDs do WhatsApp

## 2.3) Estrategias por aluno (1:N) e vinculo com mensagens

Para habilitar estrategias salvas por aluno e vinculacao da mensagem ao registro de estrategia, execute:

- `supabase/migrations/20260411000003_aluno_strategies.sql`

Essa migration:
- Cria `public.aluno_strategies` (1 aluno pode ter varias estrategias)
- Adiciona `strategy_id` em `public.historico_contatos`
- Permite carregar a estrategia completa ao clicar na mensagem/historico

## 3) Rotas

- `GET /api/renewals`
- `POST /api/renewals`
- `PATCH /api/renewals/:id`
- `DELETE /api/renewals/:id`
- `GET /api/renewals/contact-history`
- `POST /api/renewals/:id/contact`
- `GET /api/renewals/:id/strategies`
- `POST /api/renewals/:id/strategies`
- `GET /api/renewals/strategies/:strategyId`

As rotas exigem token de sessao do Supabase (Bearer) e isolam os dados por `owner_id`.

## 4) Observacao de seguranca

A chave `SUPABASE_SERVICE_ROLE_KEY` e usada apenas no backend (API routes), nunca no navegador.
