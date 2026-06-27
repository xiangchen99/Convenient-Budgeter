-- Convenient Budgeter -- initial schema
-- Tables: profiles, categories, transactions
-- Security: Row Level Security scoped to auth.uid()
-- Trigger: on new auth user, seed a profile row + default categories

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#16a34a',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists categories_user_id_idx on public.categories (user_id);

alter table public.categories enable row level security;

create policy "Categories are viewable by owner"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Categories are insertable by owner"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Categories are updatable by owner"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Categories are deletable by owner"
  on public.categories for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  amount numeric(12, 2) not null check (amount >= 0),
  occurred_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_occurred_on_idx on public.transactions (user_id, occurred_on);

alter table public.transactions enable row level security;

create policy "Transactions are viewable by owner"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Transactions are insertable by owner"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Transactions are updatable by owner"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Transactions are deletable by owner"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- New-user trigger: seed profile + default categories
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));

  insert into public.categories (user_id, name, color)
  values
    (new.id, 'Food & Dining', '#16a34a'),
    (new.id, 'Groceries', '#0d9488'),
    (new.id, 'Transport', '#2563eb'),
    (new.id, 'Shopping', '#d97706'),
    (new.id, 'Bills & Utilities', '#dc2626'),
    (new.id, 'Entertainment', '#7c3aed'),
    (new.id, 'Health', '#db2777'),
    (new.id, 'Other', '#64748b');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
