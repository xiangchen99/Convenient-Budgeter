import { cookies } from "next/headers";
import { getBudgets, getWeeklyBudgetOverride } from "@/lib/app-data";
import {
  BUDGET_PERIODS,
  BUDGET_LABELS,
  getBudgetRange,
  getWeekStartString,
} from "@/lib/budgets";
import type { Budget, BudgetPeriod } from "@/lib/types";
import { LOCAL_DATE_COOKIE, parseLocalDate } from "@/lib/dates";
import { BudgetForm } from "@/components/budget-form";
import { WeeklyBudgetOverrideForm } from "@/components/weekly-budget-override-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const localDate =
    parseLocalDate(cookieStore.get(LOCAL_DATE_COOKIE)?.value) ?? new Date();
  const budgets = await getBudgets();
  const byPeriod = new Map<BudgetPeriod, Budget>(
    budgets.map((budget) => [budget.period, budget])
  );
  const selectedWeekStart = getWeekStartString(params.week ?? localDate);
  const selectedWeekRange = getBudgetRange(
    "weekly",
    parseLocalDate(selectedWeekStart) ?? localDate
  );
  const weeklyOverride = await getWeeklyBudgetOverride(selectedWeekStart);
  const defaultWeeklyAmount = byPeriod.get("weekly")
    ? Number(byPeriod.get("weekly")!.amount)
    : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Budgets</h1>
        <p className="text-sm text-muted-foreground">
          Set total spending targets and track what you have left.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Total spending budgets</CardTitle>
          <CardDescription>
            These budgets compare against all expenses, regardless of category.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {BUDGET_PERIODS.map((period) => {
            const range = getBudgetRange(period, localDate);
            return (
              <section
                key={period}
                className="rounded-xl border bg-background p-4"
                aria-label={`${BUDGET_LABELS[period]} budget`}
              >
                <BudgetForm
                  period={period}
                  budget={byPeriod.get(period) ?? null}
                  rangeLabel={range.label}
                />
              </section>
            );
          })}
          <WeeklyBudgetOverrideForm
            weekStart={selectedWeekStart}
            rangeLabel={selectedWeekRange.label}
            defaultAmount={defaultWeeklyAmount}
            override={weeklyOverride}
          />
        </CardContent>
      </Card>
    </div>
  );
}
