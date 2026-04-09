-- Habilitar RLS em todas as tabelas
alter table if exists public.companies enable row level security;
alter table if exists public.branches enable row level security;
alter table if exists public.profiles enable row level security;
alter table if exists public.renewal_items enable row level security;

-- Função helper: retorna o perfil do usuário logado
create or replace function public.get_my_profile()
returns public.profiles
language sql stable security definer
as $$
  select * from public.profiles where id = auth.uid()
$$;

-- Função helper: retorna o papel do usuário logado
create or replace function public.get_my_role()
returns public.user_role
language sql stable security definer
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Função helper: retorna branch_id do usuário logado
create or replace function public.get_my_branch_id()
returns uuid
language sql stable security definer
as $$
  select branch_id from public.profiles where id = auth.uid()
$$;

-- Função helper: retorna company_id do usuário logado
create or replace function public.get_my_company_id()
returns uuid
language sql stable security definer
as $$
  select company_id from public.profiles where id = auth.uid()
$$;

-- Deletar políticas antigas se existirem (para re-runs)
drop policy if exists "super_admin pode tudo em companies" on public.companies;
drop policy if exists "outros veem apenas sua empresa" on public.companies;
drop policy if exists "super_admin pode tudo em branches" on public.branches;
drop policy if exists "branch_admin gerencia sua filial" on public.branches;
drop policy if exists "attendant e viewer veem sua filial" on public.branches;
drop policy if exists "super_admin pode tudo em profiles" on public.profiles;
drop policy if exists "branch_admin gerencia profiles da sua filial" on public.profiles;
drop policy if exists "usuário vê e edita o próprio perfil" on public.profiles;
drop policy if exists "super_admin vê tudo em renewal_items" on public.renewal_items;
drop policy if exists "branch_admin e attendant gerenciam renewal_items da filial" on public.renewal_items;
drop policy if exists "viewer só lê renewal_items da filial" on public.renewal_items;

-- POLÍTICAS: companies
create policy "super_admin pode tudo em companies"
  on public.companies for all
  using (get_my_role() = 'super_admin');

create policy "outros veem apenas sua empresa"
  on public.companies for select
  using (id = get_my_company_id());

-- POLÍTICAS: branches
create policy "super_admin pode tudo em branches"
  on public.branches for all
  using (get_my_role() = 'super_admin');

create policy "branch_admin gerencia sua filial"
  on public.branches for all
  using (
    get_my_role() = 'branch_admin'
    and id = get_my_branch_id()
  );

create policy "attendant e viewer veem sua filial"
  on public.branches for select
  using (id = get_my_branch_id());

-- POLÍTICAS: profiles
create policy "super_admin pode tudo em profiles"
  on public.profiles for all
  using (get_my_role() = 'super_admin');

create policy "branch_admin gerencia profiles da sua filial"
  on public.profiles for all
  using (
    get_my_role() = 'branch_admin'
    and branch_id = get_my_branch_id()
  );

create policy "usuário vê e edita o próprio perfil"
  on public.profiles for all
  using (id = auth.uid());

-- POLÍTICAS: renewal_items (alunos/renovações)
create policy "super_admin vê tudo em renewal_items"
  on public.renewal_items for all
  using (get_my_role() = 'super_admin');

create policy "branch_admin e attendant gerenciam renewal_items da filial"
  on public.renewal_items for all
  using (
    get_my_role() in ('branch_admin', 'attendant')
    and branch_id = get_my_branch_id()
  );

create policy "viewer só lê renewal_items da filial"
  on public.renewal_items for select
  using (
    get_my_role() = 'viewer'
    and branch_id = get_my_branch_id()
  );
