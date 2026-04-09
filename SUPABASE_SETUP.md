# Supabase Setup - Lista de Renovacao

## 1) Variaveis no Vercel

Adicione no projeto:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## 2) Criar tabela no Supabase (SQL Editor)

```sql
create extension if not exists pgcrypto;

create table if not exists public.renewal_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  phone text,
  plan text not null,
  status text not null check (status in ('ativo', 'sumido', 'critico', 'renovado')),
  renewal_date date,
  last_contact text,
  owner text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists renewal_items_created_at_idx on public.renewal_items (created_at desc);
create index if not exists renewal_items_status_idx on public.renewal_items (status);
create index if not exists renewal_items_plan_idx on public.renewal_items (plan);
create index if not exists renewal_items_owner_id_idx on public.renewal_items (owner_id);

create table if not exists public.contact_history (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  renewal_item_id uuid not null references public.renewal_items(id) on delete cascade,
  student_name text not null,
  channel text not null check (channel in ('whatsapp')),
  phone text not null,
  message text not null,
  status text not null check (status in ('enviado', 'erro')),
  sent_at timestamptz not null default now(),
  provider_message_id text,
  error_message text,
  owner text,
  created_at timestamptz not null default now()
);

create index if not exists contact_history_owner_id_idx on public.contact_history (owner_id);
create index if not exists contact_history_renewal_item_id_idx on public.contact_history (renewal_item_id);
create index if not exists contact_history_sent_at_idx on public.contact_history (sent_at desc);
```

Se a tabela ja foi criada sem `owner_id`, rode:

```sql
alter table public.renewal_items add column if not exists owner_id uuid;
alter table public.renewal_items add column if not exists phone text;
update public.renewal_items set owner_id = '00000000-0000-0000-0000-000000000000' where owner_id is null;
alter table public.renewal_items alter column owner_id set not null;

alter table public.renewal_items alter column owner set not null;
create index if not exists renewal_items_owner_id_idx on public.renewal_items (owner_id);
```

Observacao: para manter isolamento por atendente, use dados novos apos autenticar no app.

## 3) Rotas criadas

- `GET /api/renewals`
- `POST /api/renewals`
- `PATCH /api/renewals/:id`
- `DELETE /api/renewals/:id`
- `GET /api/renewals/contact-history`
- `POST /api/renewals/:id/contact`

As rotas exigem token de sessao do Supabase (Bearer) e isolam os dados por `owner_id`.

## 4) Observacao de seguranca

A chave `SUPABASE_SERVICE_ROLE_KEY` e usada apenas no backend (API routes), nunca no navegador.
