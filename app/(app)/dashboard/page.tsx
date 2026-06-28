import Link from "next/link";
import { cookies } from "next/headers";
import {
  format,
  getDaysInMonth,
  subDays,
} from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { Budget, BudgetPeriod, TransactionWithCategory } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { calculateBudgetProgress, getBudgetRange } from "@/lib/budgets";
import {
  getTransactionAllocationsInRange,
  sumAllocations,
} from "@/lib/allocations";
import {
  formatLocalDate,
  formatLocalMonth,
  LOCAL_DATE_COOKIE,
  LOCAL_MONTH_COOKIE,
  parseLocalDate,
  parseLocalMonth,
} from "@/lib/dates";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MonthNav } from "@/components/month-nav";
import {
  LazySpendOverTime,
  LazySpendByCategory,
  type DailyPoint,
  type CategorySlice,
} from "@/components/charts/lazy-dashboard-charts";
import { BudgetProgressCards } from "@/components/charts/budget-progress";
import { TransactionDialog } from "@/components/transaction-dialog";

export const dynamic = "force-dynamic";

const BUDGET_PERIODS: BudgetPeriod[] = ["daily", "weekly", "monthly"];

function isoMonth(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const localDate =
    parseLocalDate(cookieStore.get(LOCAL_DATE_COOKIE)?.value) ?? new Date();
  const localMonth =
    cookieStore.get(LOCAL_MONTH_COOKIE)?.value ?? formatLocalMonth(localDate);
  const currentMonth = /^\d{4}-\d{2}$/.test(localMonth)
    ? localMonth
    : isoMonth(localDate);

  const monthParam =
    params.month && /^\d{4}-\d{2}$/.test(params.month)
      ? params.month
      : currentMonth;

  const monthDate = parseLocalMonth(monthParam) ?? localDate;
  const monthRange = getBudgetRange("monthly", monthDate);
  const dayRange = getBudgetRange("daily", localDate);
  const weekRange = getBudgetRange("weekly", localDate);
  const startStr = monthRange.startStr;
  const endStr = monthRange.endStr;
  const earliestRangeStart = new Date(
    Math.min(
      monthRange.start.getTime(),
      dayRange.start.getTime(),
      weekRange.start.getTime()
    )
  );
  const latestRangeEnd = new Date(
    Math.max(
      monthRange.end.getTime(),
      dayRange.end.getTime(),
      weekRange.end.getTime()
    )
  );
  const allocationQueryStart = formatLocalDate(subDays(earliestRangeStart, 364));
  const allocationQueryEnd = formatLocalDate(latestRangeEnd);

  const supabase = await createClient();
  const [
    { data: categories },
    { data: budgetData },
    { data: txnData },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, user_id, name, color, created_at")
      .order("name"),
    supabase
      .from("budgets")
      .select("id, user_id, period, amount, created_at, updated_at"),
    supabase
      .from("transactions")
      .select(
        "id, user_id, category_id, amount, occurred_on, split_days, note, created_at, category:categories(id, name, color)"
      )
      .gte("occurred_on", allocationQueryStart)
      .lte("occurred_on", allocationQueryEnd)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const txns = (txnData ?? []) as unknown as TransactionWithCategory[];
  const budgets = (budgetData ?? []) as unknown as Budget[];
  const budgetsByPeriod = new Map<BudgetPeriod, Budget>(
    budgets.map((budget) => [budget.period, budget])
  );

  const monthAllocations = getTransactionAllocationsInRange(
    txns,
    startStr,
    endStr
  );
  const dayAllocations = getTransactionAllocationsInRange(
    txns,
    dayRange.startStr,
    dayRange.endStr
  );
  const weekAllocations = getTransactionAllocationsInRange(
    txns,
    weekRange.startStr,
    weekRange.endStr
  );
  const displayTxns = txns.filter(
    (transaction) =>
      transaction.occurred_on >= startStr && transaction.occurred_on <= endStr
  );

  // Monthly allocation total + original purchase count
  const monthTotal = sumAllocations(monthAllocations);
  const count = displayTxns.length;

  // Daily series
  const daysInMonth = getDaysInMonth(monthDate);
  const perDay = new Array<number>(daysInMonth).fill(0);
  for (const allocation of monthAllocations) {
    const day = Number(allocation.date.slice(8, 10));
    if (day >= 1 && day <= daysInMonth) {
      perDay[day - 1] += allocation.amount;
    }
  }
  const dailyPoints: DailyPoint[] = perDay.map((amount, i) => ({
    label: String(i + 1),
    amount: Math.round(amount * 100) / 100,
  }));

  // Category breakdown
  const byCategory = new Map<string, CategorySlice>();
  for (const allocation of monthAllocations) {
    const name = allocation.category?.name ?? "Uncategorized";
    const color = allocation.category?.color ?? "#94a3b8";
    const existing = byCategory.get(name);
    if (existing) existing.value += allocation.amount;
    else byCategory.set(name, { name, value: allocation.amount, color });
  }
  const categorySlices = [...byCategory.values()]
    .map((s) => ({ ...s, value: Math.round(s.value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  const topCategory = categorySlices[0];
  const avgPerActiveDay =
    perDay.filter((v) => v > 0).length > 0
      ? monthTotal / perDay.filter((v) => v > 0).length
      : 0;

  const recent = displayTxns.slice(0, 5);
  const spentByPeriod: Record<BudgetPeriod, number> = {
    daily: sumAllocations(dayAllocations),
    weekly: sumAllocations(weekAllocations),
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
          <LazySpendOverTime data={dailyPoints} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">By category</CardTitle>
        </CardHeader>
        <CardContent>
          <LazySpendByCategory data={categorySlices} />
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
                      {format(parseLocalDate(t.occurred_on) ?? localDate, "MMM d")}
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
      <TransactionDialog categories={categories ?? []} trigger="floating" />
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
