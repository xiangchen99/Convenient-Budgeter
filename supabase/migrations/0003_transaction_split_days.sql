-- Convenient Budgeter -- split purchases across forward calendar days
-- Keeps one original transaction row while allowing budget/dashboard allocation
-- across purchase date plus the next split_days - 1 days.

alter table public.transactions
  add column if not exists split_days integer not null default 1
  check (split_days between 1 and 365);
