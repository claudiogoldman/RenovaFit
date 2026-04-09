# Supabase Setup - Lista de Renovacao

## 1) Variaveis no Vercel

Adicione no projeto:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 2) Criar tabela no Supabase (SQL Editor)

```sql
create extension if not exists pgcrypto;

create table if not exists public.renewal_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null,
  status text not null check (status in ('ativo', 'sumido', 'critico', 'renovado')),
  renewal_date date,
  last_contact text,
  owner text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists renewal_items_created_at_idx on public.renewal_items (created_at desc);
create index if not exists renewal_items_status_idx on public.renewal_items (status);
create index if not exists renewal_items_plan_idx on public.renewal_items (plan);
```

## 3) Rotas criadas

- `GET /api/renewals`
- `POST /api/renewals`
- `PATCH /api/renewals/:id`
- `DELETE /api/renewals/:id`

## 4) Observacao de seguranca

A chave `SUPABASE_SERVICE_ROLE_KEY` e usada apenas no backend (API routes), nunca no navegador.
