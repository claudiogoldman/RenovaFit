alter table public.aluno_strategies
  add column if not exists profile_snapshot jsonb;
