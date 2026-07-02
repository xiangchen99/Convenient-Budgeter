export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  occurred_on: string; // YYYY-MM-DD
  split_days: number;
  weekly_budget_start: string | null; // YYYY-MM-DD Monday, or null for normal weekly budget
  note: string | null;
  created_at: string;
};

export type TransactionWithCategory = Transaction & {
  category: Pick<Category, "id" | "name" | "color"> | null;
};

export type BudgetPeriod = "daily" | "weekly" | "monthly";

export type Budget = {
  id: string;
  user_id: string;
  period: BudgetPeriod;
  amount: number;
  created_at: string;
  updated_at: string;
};

export type WeeklyBudgetOverride = {
  id: string;
  user_id: string;
  week_start: string; // YYYY-MM-DD Monday
  amount: number;
  created_at: string;
  updated_at: string;
};

export type ExpenseTemplate = {
  id: string;
  user_id: string;
  name: string;
  category_id: string | null;
  amount: number;
  split_days: number;
  note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ExpenseTemplateWithCategory = ExpenseTemplate & {
  category: Pick<Category, "id" | "name" | "color"> | null;
};
