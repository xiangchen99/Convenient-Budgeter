import Link from "next/link";
import {
  format,
  getDaysInMonth,
  parseISO,
} from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { Budget, BudgetPeriod, TransactionWithCategory } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { calculateBudgetProgress, getBudgetRange } from "@/lib/budgets";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MonthNav } from "@/components/month-nav";
import {
  SpendOverTime,
  type DailyPoint,
} from "@/components/charts/spend-over-time";
import {
  SpendByCategory,
  type CategorySlice,
} from "@/components/charts/spend-by-category";
import { BudgetProgressCards } from "@/components/charts/budget-progress";
import { TransactionDialog } from "@/components/transaction-dialog";

export const dynamic = "force-dynamic";

const BUDGET_PERIODS: BudgetPeriod[] = ["daily", "weekly", "monthly"];

function isoMonth(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function sumAmounts(rows: { amount: number | string }[] | null) {
  return (rows ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const currentMonth = isoMonth(now);

  const monthParam =
    params.month && /^\d{4}-\d{2}$/.test(params.month)
      ? params.month
      : currentMonth;

  const monthDate = parseISO(`${monthParam}-01`);
  const monthRange = getBudgetRange("monthly", monthDate);
  const dayRange = getBudgetRange("daily", now);
  const weekRange = getBudgetRange("weekly", now);
  const startStr = monthRange.startStr;
  const endStr = monthRange.endStr;

  const supabase = await createClient();
  const [
    { data: categories },
    { data: budgetData },
    { data: txnData },
    { data: dayTxnData },
    { data: weekTxnData },
  ] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("budgets").select("*"),
    supabase
      .from("transactions")
      .select("*, category:categories(id, name, color)")
      .gte("occurred_on", startStr)
      .lte("occurred_on", endStr)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("amount")
      .gte("occurred_on", dayRange.startStr)
      .lte("occurred_on", dayRange.endStr),
    supabase
      .from("transactions")
      .select("amount")
      .gte("occurred_on", weekRange.startStr)
      .lte("occurred_on", weekRange.endStr),
  ]);

  const txns = (txnData ?? []) as unknown as TransactionWithCategory[];
  const budgets = (budgetData ?? []) as unknown as Budget[];
  const budgetsByPeriod = new Map<BudgetPeriod, Budget>(
    budgets.map((budget) => [budget.period, budget])
  );

  // Monthly total + count
  const monthTotal = txns.reduce((sum, t) => sum + Number(t.amount), 0);
  const count = txns.length;

  // Daily series
  const daysInMonth = getDaysInMonth(monthDate);
  const perDay = new Array<number>(daysInMonth).fill(0);
  for (const t of txns) {
    const day = Number(t.occurred_on.slice(8, 10));
    if (day >= 1 && day <= daysInMonth) perDay[day - 1] += Number(t.amount);
  }
  const dailyPoints: DailyPoint[] = perDay.map((amount, i) => ({
    label: String(i + 1),
    amount: Math.round(amount * 100) / 100,
  }));

  // Category breakdown
  const byCategory = new Map<string, CategorySlice>();
  for (const t of txns) {
    const name = t.category?.name ?? "Uncategorized";
    const color = t.category?.color ?? "#94a3b8";
    const existing = byCategory.get(name);
    if (existing) existing.value += Number(t.amount);
    else byCategory.set(name, { name, value: Number(t.amount), color });
  }
  const categorySlices = [...byCategory.values()]
    .map((s) => ({ ...s, value: Math.round(s.value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  const topCategory = categorySlices[0];
  const avgPerActiveDay =
    perDay.filter((v) => v > 0).length > 0
      ? monthTotal / perDay.filter((v) => v > 0).length
      : 0;

  const recent = txns.slice(0, 5);
  const spentByPeriod: Record<BudgetPeriod, number> = {
    daily: sumAmounts(dayTxnData),
    weekly: sumAmounts(weekTxnData),
    monthly: monthTotal,
  };
  const rangeByPeriod = {
    daily: dayRange,
    weekly: weekRange,
    monthly: monthRange,
  };
  const budgetProgress = BUDGET_PERIODS.map((period) =>
    calculateBudgetProgress({
      period,
      budget: budgetsByPeriod.get(period) ?? null,
      spent: spentByPeriod[period],
      rangeLabel: rangeByPeriod[period].label,
    })
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <TransactionDialog categories={categories ?? []} />
      </div>

      <BudgetProgressCards budgets={budgetProgress} />

      <Card>
        <CardContent className="space-y-3 p-4">
          <MonthNav
            month={monthParam}
            label={format(monthDate, "MMMM yyyy")}
            isCurrent={monthParam === currentMonth}
          />
          <div className="grid grid-cols-3 gap-3 pt-1">
            <Stat label="Spent" value={formatCurrency(monthTotal)} />
            <Stat
              label="Daily avg"
              value={formatCurrency(avgPerActiveDay)}
            />
            <Stat label="Entries" value={String(count)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Spending over time</CardTitle>
        </CardHeader>
        <CardContent className="px-2">
          <SpendOverTime data={dailyPoints} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">By category</CardTitle>
        </CardHeader>
        <CardContent>
          <SpendByCategory data={categorySlices} />
          {topCategory && (
            <p className="mt-3 text-xs text-muted-foreground">
              Top category:{" "}
              <span className="font-medium text-foreground">
                {topCategory.name}
              </span>{" "}
              ({formatCurrency(topCategory.value)})
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Recent</CardTitle>
          <Link
            href="/transactions"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              No expenses this month.
            </p>
          ) : (
            <ul className="divide-y">
              {recent.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-6 py-3">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: t.category?.color ?? "#94a3b8" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {t.category?.name ?? "Uncategorized"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(t.occurred_on), "MMM d")}
                      {t.note ? ` · ${t.note}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(Number(t.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-bold tabular-nums">{value}</p>
    </div>
  );
}
