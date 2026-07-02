-- Convenient Budgeter -- weekly budget overrides, budget carryover, templates
-- Adds one-off weekly budget targets, lets expenses count against a future
-- weekly budget, and stores quick-add expense templates.

alter table public.transactions
  add column if not exists weekly_budget_start date
  check (
    weekly_budget_start is null
    or extract(dow from weekly_budget_start) = 1
  );

create index if not exists transactions_weekly_budget_start_idx
  on public.transactions (user_id, weekly_budget_start)
  where weekly_budget_start is not null;

create table if not exists public.weekly_budget_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null check (extract(dow from week_start) = 1),
  amount numeric(12, 2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create index if not exists weekly_budget_overrides_user_week_idx
  on public.weekly_budget_overrides (user_id, week_start);

alter table public.weekly_budget_overrides enable row level security;

create policy "Weekly budget overrides are viewable by owner"
  on public.weekly_budget_overrides for select
  using (auth.uid() = user_id);

create policy "Weekly budget overrides are insertable by owner"
  on public.weekly_budget_overrides for insert
  with check (auth.uid() = user_id);

create policy "Weekly budget overrides are updatable by owner"
  on public.weekly_budget_overrides for update
  using (auth.uid() = user_id);

create policy "Weekly budget overrides are deletable by owner"
  on public.weekly_budget_overrides for delete
  using (auth.uid() = user_id);

drop trigger if exists set_weekly_budget_overrides_updated_at
  on public.weekly_budget_overrides;

create trigger set_weekly_budget_overrides_updated_at
  before update on public.weekly_budget_overrides
  for each row execute function public.set_updated_at();

create table if not exists public.expense_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category_id uuid references public.categories (id) on delete set null,
  amount numeric(12, 2) not null check (amount >= 0),
  split_days integer not null default 1 check (split_days between 1 and 365),
  note text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists expense_templates_user_order_idx
  on public.expense_templates (user_id, sort_order, created_at);

alter table public.expense_templates enable row level security;

create policy "Expense templates are viewable by owner"
  on public.expense_templates for select
  using (auth.uid() = user_id);

create policy "Expense templates are insertable by owner"
  on public.expense_templates for insert
  with check (auth.uid() = user_id);

create policy "Expense templates are updatable by owner"
  on public.expense_templates for update
  using (auth.uid() = user_id);

create policy "Expense templates are deletable by owner"
  on public.expense_templates for delete
  using (auth.uid() = user_id);

drop trigger if exists set_expense_templates_updated_at
  on public.expense_templates;

create trigger set_expense_templates_updated_at
  before update on public.expense_templates
  for each row execute function public.set_updated_at();
