import { createClient } from "@/lib/supabase/server";
import {
  BUDGET_PERIODS,
  BUDGET_LABELS,
  getBudgetRange,
} from "@/lib/budgets";
import type { Budget, BudgetPeriod } from "@/lib/types";
import { BudgetForm } from "@/components/budget-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("budgets").select("*").order("period");
  const budgets = (data ?? []) as unknown as Budget[];
  const byPeriod = new Map<BudgetPeriod, Budget>(
    budgets.map((budget) => [budget.period, budget])
  );

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
            const range = getBudgetRange(period);
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
        </CardContent>
      </Card>
    </div>
  );
}
