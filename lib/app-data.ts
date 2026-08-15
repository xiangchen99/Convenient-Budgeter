import { cache } from "react";
import { getCurrentUser } from "@/lib/db/auth";
import {
  fetchBudgets,
  fetchCategories,
  fetchExpenseTemplates,
  fetchWeeklyBudgetOverride,
} from "@/lib/db/queries";
import type {
  Budget,
  Category,
  ExpenseTemplateWithCategory,
  WeeklyBudgetOverride,
} from "@/lib/types";

export const getCategories = cache(async function getCategories(): Promise<
  Category[]
> {
  const user = await getCurrentUser();
  if (!user) return [];
  return fetchCategories(user.id);
});

export const getBudgets = cache(async function getBudgets(): Promise<Budget[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  return fetchBudgets(user.id);
});

export const getWeeklyBudgetOverride = cache(
  async function getWeeklyBudgetOverride(
    weekStart: string
  ): Promise<WeeklyBudgetOverride | null> {
    const user = await getCurrentUser();
    if (!user) return null;
    return fetchWeeklyBudgetOverride(user.id, weekStart);
  }
);

export const getExpenseTemplates = cache(
  async function getExpenseTemplates(): Promise<ExpenseTemplateWithCategory[]> {
    const user = await getCurrentUser();
    if (!user) return [];
    return fetchExpenseTemplates(user.id);
  }
);
