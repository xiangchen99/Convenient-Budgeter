import Link from "next/link";
import type { BudgetProgress as BudgetProgressData } from "@/lib/budgets";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function BudgetProgressCards({
  budgets,
}: {
  budgets: BudgetProgressData[];
}) {
  const primary = budgets.find((budget) => budget.period === "daily") ?? budgets[0];
  const secondary = budgets.filter((budget) => budget.period !== primary?.period);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 pb-2">
        <div>
          <CardTitle className="text-base">Today&apos;s budget</CardTitle>
          <CardDescription>
            Your fastest check before logging another expense.
          </CardDescription>
        </div>
        <Link
          href="/budgets"
          className="shrink-0 text-sm font-medium text-primary hover:underline"
        >
          Edit
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {primary && <BudgetProgressCard budget={primary} prominent />}
        <div className="grid gap-3 sm:grid-cols-2">
          {secondary.map((budget) => (
            <BudgetProgressCard key={budget.period} budget={budget} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BudgetProgressCard({
  budget,
  prominent = false,
}: {
  budget: BudgetProgressData;
  prominent?: boolean;
}) {
  const hasBudget = budget.budgetAmount > 0;
  const clampedPercent = Math.min(budget.percentUsed, 100);
  const statusLabel = !hasBudget
    ? "Not set"
    : budget.isOverBudget
      ? "Over budget"
      : budget.isNearLimit
        ? "Close to limit"
        : "On track";
  const remainingLabel = budget.period === "daily" ? "today" : budget.period;
  const mainText = !hasBudget
    ? "Set a budget"
    : budget.isOverBudget
      ? `${formatCurrency(Math.abs(budget.remaining))} over ${remainingLabel}`
      : `${formatCurrency(budget.remaining)} left ${remainingLabel}`;

  return (
    <div
      className={cn(
        "rounded-xl border bg-background p-4",
        prominent && "border-primary/30 bg-primary/5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{budget.label}</h3>
          <p className="text-xs text-muted-foreground">{budget.rangeLabel}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            budget.isOverBudget
              ? "bg-destructive/10 text-destructive"
              : budget.isNearLimit
                ? "bg-orange-100 text-orange-700"
                : hasBudget
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p
              className={cn(
                "font-bold tabular-nums",
                prominent ? "text-2xl" : "text-lg",
                budget.isOverBudget && "text-destructive"
              )}
            >
              {mainText}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Spent</p>
            <p className="text-sm font-semibold tabular-nums">
              {formatCurrency(budget.spent)}
              {hasBudget && (
                <span className="text-muted-foreground">
                  {" "}
                  / {formatCurrency(budget.budgetAmount)}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              budget.isOverBudget
                ? "bg-destructive"
                : budget.isNearLimit
                  ? "bg-orange-500"
                  : "bg-primary"
            )}
            style={{ width: `${hasBudget ? clampedPercent : 0}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{hasBudget ? `${budget.percentUsed.toFixed(0)}% used` : ""}</span>
          {budget.isOverBudget && (
            <span className="font-medium text-destructive">
              {formatCurrency(Math.abs(budget.remaining))} over
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
