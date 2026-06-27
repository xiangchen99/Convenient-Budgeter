import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Budget, BudgetPeriod } from "@/lib/types";

export const BUDGET_PERIODS: BudgetPeriod[] = ["daily", "weekly", "monthly"];

export const BUDGET_LABELS: Record<BudgetPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export const BUDGET_DESCRIPTIONS: Record<BudgetPeriod, string> = {
  daily: "Resets every day",
  weekly: "Resets every Monday",
  monthly: "Resets on the first of each month",
};

export type BudgetRange = {
  start: Date;
  end: Date;
  startStr: string;
  endStr: string;
  label: string;
};

export type BudgetProgress = {
  period: BudgetPeriod;
  label: string;
  rangeLabel: string;
  budget: Budget | null;
  budgetAmount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
};

export function getBudgetRange(
  period: BudgetPeriod,
  baseDate = new Date()
): BudgetRange {
  const start =
    period === "daily"
      ? startOfDay(baseDate)
      : period === "weekly"
        ? startOfWeek(baseDate, { weekStartsOn: 1 })
        : startOfMonth(baseDate);

  const end =
    period === "daily"
      ? endOfDay(baseDate)
      : period === "weekly"
        ? endOfWeek(baseDate, { weekStartsOn: 1 })
        : endOfMonth(baseDate);

  const label =
    period === "daily"
      ? format(start, "MMM d, yyyy")
      : `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;

  return {
    start,
    end,
    startStr: format(start, "yyyy-MM-dd"),
    endStr: format(end, "yyyy-MM-dd"),
    label,
  };
}

export function calculateBudgetProgress({
  period,
  budget,
  spent,
  rangeLabel,
}: {
  period: BudgetPeriod;
  budget: Budget | null;
  spent: number;
  rangeLabel: string;
}): BudgetProgress {
  const budgetAmount = budget ? Number(budget.amount) : 0;
  const roundedSpent = roundMoney(spent);
  const remaining = roundMoney(budgetAmount - roundedSpent);
  const percentUsed =
    budgetAmount > 0 ? Math.min((roundedSpent / budgetAmount) * 100, 999) : 0;

  return {
    period,
    label: BUDGET_LABELS[period],
    rangeLabel,
    budget,
    budgetAmount,
    spent: roundedSpent,
    remaining,
    percentUsed,
    isOverBudget: budgetAmount > 0 && roundedSpent > budgetAmount,
    isNearLimit:
      budgetAmount > 0 && roundedSpent <= budgetAmount && percentUsed >= 85,
  };
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
