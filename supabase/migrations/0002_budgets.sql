-- Convenient Budgeter -- total spending budgets
-- Adds daily, weekly, and monthly total budget targets per user.

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  period text not null check (period in ('daily', 'weekly', 'monthly')),
  amount numeric(12, 2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period)
);

create index if not exists budgets_user_id_idx on public.budgets (user_id);

alter table public.budgets enable row level security;

create policy "Budgets are viewable by owner"
  on public.budgets for select
  using (auth.uid() = user_id);

create policy "Budgets are insertable by owner"
  on public.budgets for insert
  with check (auth.uid() = user_id);

create policy "Budgets are updatable by owner"
  on public.budgets for update
  using (auth.uid() = user_id);

create policy "Budgets are deletable by owner"
  on public.budgets for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_budgets_updated_at on public.budgets;

create trigger set_budgets_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();
