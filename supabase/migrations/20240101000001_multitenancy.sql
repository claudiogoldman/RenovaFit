-- EMPRESAS (redes de academias)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- FILIAIS
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  city text,
  state text,
  phone text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ENUM: Papéis de usuário
create type if not exists public.user_role as enum (
  'super_admin',
  'branch_admin',
  'attendant',
  'viewer'
);

-- PERFIS DE USUÁRIO (estende auth.users do Supabase)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id),
  branch_id uuid references public.branches(id),
  role public.user_role not null default 'attendant',
  full_name text,
  avatar_url text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Adicionar colunas à tabela de renovações (se ainda não existirem)
alter table if exists public.renewal_items
  add column if not exists branch_id uuid references public.branches(id),
  add column if not exists company_id uuid references public.companies(id);

-- Índices para performance
create index if not exists branches_company_id_idx on public.branches(company_id);
create index if not exists profiles_company_id_idx on public.profiles(company_id);
create index if not exists profiles_branch_id_idx on public.profiles(branch_id);
create index if not exists renewal_items_branch_id_idx on public.renewal_items(branch_id);
create index if not exists renewal_items_company_id_idx on public.renewal_items(company_id);

-- Trigger: auto-criar perfil ao registrar usuário
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

-- Drop trigger se já existir (para evitar erro em re-runs)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
