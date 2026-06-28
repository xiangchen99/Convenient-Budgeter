import { describe, expect, it } from "vitest";
import {
  calculateBudgetProgress,
  getBudgetRange,
  roundMoney,
} from "@/lib/budgets";
import type { Budget } from "@/lib/types";

function budget(amount: number): Budget {
  return {
    id: "budget-1",
    user_id: "user-1",
    period: "daily",
    amount,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
  };
}

describe("budget helpers", () => {
  it("builds daily ranges as local YYYY-MM-DD dates", () => {
    const range = getBudgetRange("daily", new Date(2026, 5, 27, 19, 45));

    expect(range.startStr).toBe("2026-06-27");
    expect(range.endStr).toBe("2026-06-27");
    expect(range.label).toBe("Jun 27, 2026");
  });

  it("builds weekly ranges from Monday through Sunday", () => {
    const range = getBudgetRange("weekly", new Date(2026, 5, 27));

    expect(range.startStr).toBe("2026-06-22");
    expect(range.endStr).toBe("2026-06-28");
    expect(range.label).toBe("Jun 22 - Jun 28, 2026");
  });

  it("builds monthly ranges for the selected month", () => {
    const range = getBudgetRange("monthly", new Date(2026, 6, 4));

    expect(range.startStr).toBe("2026-07-01");
    expect(range.endStr).toBe("2026-07-31");
  });

  it("calculates remaining budget and usage percent", () => {
    const progress = calculateBudgetProgress({
      period: "daily",
      budget: budget(50),
      spent: 12.345,
      rangeLabel: "Jun 27, 2026",
    });

    expect(progress.spent).toBe(12.35);
    expect(progress.remaining).toBe(37.65);
    expect(progress.percentUsed).toBeCloseTo(24.7);
    expect(progress.isNearLimit).toBe(false);
    expect(progress.isOverBudget).toBe(false);
  });

  it("marks near-limit and over-budget states", () => {
    const nearLimit = calculateBudgetProgress({
      period: "daily",
      budget: budget(100),
      spent: 90,
      rangeLabel: "Jun 27, 2026",
    });
    const overBudget = calculateBudgetProgress({
      period: "daily",
      budget: budget(100),
      spent: 125,
      rangeLabel: "Jun 27, 2026",
    });

    expect(nearLimit.isNearLimit).toBe(true);
    expect(nearLimit.isOverBudget).toBe(false);
    expect(overBudget.isOverBudget).toBe(true);
    expect(overBudget.remaining).toBe(-25);
  });

  it("handles missing budgets without dividing by zero", () => {
    const progress = calculateBudgetProgress({
      period: "monthly",
      budget: null,
      spent: 25,
      rangeLabel: "Jun 1 - Jun 30, 2026",
    });

    expect(progress.budgetAmount).toBe(0);
    expect(progress.percentUsed).toBe(0);
    expect(progress.isNearLimit).toBe(false);
    expect(progress.isOverBudget).toBe(false);
  });

  it("rounds money to cents", () => {
    expect(roundMoney(10.005)).toBe(10.01);
    expect(roundMoney(10.004)).toBe(10);
  });
});
