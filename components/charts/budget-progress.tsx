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
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 pb-2">
        <div>
          <CardTitle className="text-base">Budget progress</CardTitle>
          <CardDescription>
            Track how much spending room you have left.
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
        {budgets.map((budget) => (
          <BudgetProgressCard key={budget.period} budget={budget} />
        ))}
      </CardContent>
    </Card>
  );
}

function BudgetProgressCard({ budget }: { budget: BudgetProgressData }) {
  const hasBudget = budget.budgetAmount > 0;
  const clampedPercent = Math.min(budget.percentUsed, 100);
  const statusLabel = !hasBudget
    ? "Not set"
    : budget.isOverBudget
      ? "Over budget"
      : budget.isNearLimit
        ? "Close to limit"
        : "On track";

  return (
    <div className="rounded-xl border bg-background p-4">
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
                "text-lg font-bold tabular-nums",
                budget.isOverBudget && "text-destructive"
              )}
            >
              {hasBudget
                ? formatCurrency(Math.max(budget.remaining, 0))
                : "Set a budget"}
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
