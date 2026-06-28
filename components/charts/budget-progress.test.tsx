import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BudgetProgressCards } from "@/components/charts/budget-progress";
import type { BudgetProgress } from "@/lib/budgets";

function progress(overrides: Partial<BudgetProgress>): BudgetProgress {
  return {
    period: "daily",
    label: "Daily",
    rangeLabel: "Jun 27, 2026",
    budget: {
      id: "budget-1",
      user_id: "user-1",
      period: "daily",
      amount: 50,
      created_at: "2026-06-01T00:00:00Z",
      updated_at: "2026-06-01T00:00:00Z",
    },
    budgetAmount: 50,
    spent: 12,
    remaining: 38,
    percentUsed: 24,
    isOverBudget: false,
    isNearLimit: false,
    ...overrides,
  };
}

describe("BudgetProgressCards", () => {
  it("emphasizes the daily remaining-budget answer", () => {
    render(
      <BudgetProgressCards
        budgets={[
          progress({}),
          progress({
            period: "weekly",
            label: "Weekly",
            rangeLabel: "Jun 22 - Jun 28, 2026",
          }),
        ]}
      />
    );

    expect(screen.getByText("Today's budget")).toBeInTheDocument();
    expect(screen.getByText("$38.00 left today")).toBeInTheDocument();
    expect(screen.getAllByText("On track").length).toBeGreaterThan(0);
  });

  it("shows over-budget copy when spending passes the budget", () => {
    render(
      <BudgetProgressCards
        budgets={[
          progress({
            spent: 62.5,
            remaining: -12.5,
            percentUsed: 125,
            isOverBudget: true,
          }),
        ]}
      />
    );

    expect(screen.getByText("Over budget")).toBeInTheDocument();
    expect(screen.getByText("$12.50 over today")).toBeInTheDocument();
  });

  it("prompts users to set a budget when none exists", () => {
    render(
      <BudgetProgressCards
        budgets={[
          progress({
            budget: null,
            budgetAmount: 0,
            spent: 15,
            remaining: -15,
            percentUsed: 0,
          }),
        ]}
      />
    );

    expect(screen.getByText("Not set")).toBeInTheDocument();
    expect(screen.getByText("Set a budget")).toBeInTheDocument();
  });
});
