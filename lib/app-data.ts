import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  Budget,
  Category,
  ExpenseTemplateWithCategory,
  WeeklyBudgetOverride,
} from "@/lib/types";

export const getCategories = cache(async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, user_id, name, color, created_at")
    .order("name");

  return (data ?? []) as Category[];
});

export const getBudgets = cache(async function getBudgets() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("budgets")
    .select("id, user_id, period, amount, created_at, updated_at")
    .order("period");

  return (data ?? []) as unknown as Budget[];
});

export const getWeeklyBudgetOverride = cache(
  async function getWeeklyBudgetOverride(weekStart: string) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("weekly_budget_overrides")
      .select("id, user_id, week_start, amount, created_at, updated_at")
      .eq("week_start", weekStart)
      .maybeSingle();

    return (data ?? null) as unknown as WeeklyBudgetOverride | null;
  }
);

export const getExpenseTemplates = cache(async function getExpenseTemplates() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("expense_templates")
    .select(
      "id, user_id, name, category_id, amount, split_days, note, sort_order, created_at, updated_at, category:categories(id, name, color)"
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (data ?? []) as unknown as ExpenseTemplateWithCategory[];
});
