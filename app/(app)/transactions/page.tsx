import { cookies } from "next/headers";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { Category, TransactionWithCategory } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { getBudgetRange } from "@/lib/budgets";
import {
  formatLocalMonth,
  LOCAL_DATE_COOKIE,
  LOCAL_MONTH_COOKIE,
  parseLocalDate,
  parseLocalMonth,
} from "@/lib/dates";
import { TransactionDialog } from "@/components/transaction-dialog";
import { TransactionEditManager } from "@/components/transaction-edit-manager";
import { TransactionRow } from "@/components/transaction-row";
import { MonthNav } from "@/components/month-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export const dynamic = "force-dynamic";

function isoMonth(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; q?: string; category?: string }>;
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
  const search = String(params.q ?? "").trim();
  const categoryFilter = String(params.category ?? "");

  const supabase = await createClient();

  const transactionQuery = supabase
    .from("transactions")
    .select(
      "id, user_id, category_id, amount, occurred_on, split_days, note, created_at, category:categories(id, name, color)"
    )
    .gte("occurred_on", monthRange.startStr)
    .lte("occurred_on", monthRange.endStr)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (categoryFilter === "__none") {
    transactionQuery.is("category_id", null);
  } else if (categoryFilter) {
    transactionQuery.eq("category_id", categoryFilter);
  }

  const [{ data: categories }, { data: transactions }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, user_id, name, color, created_at")
      .order("name"),
    transactionQuery,
  ]);

  const cats = (categories ?? []) as Category[];
  const monthTxns = (transactions ?? []) as unknown as TransactionWithCategory[];
  const txns = search
    ? monthTxns.filter((t) => {
        const haystack = `${t.note ?? ""} ${t.category?.name ?? "Uncategorized"}`;
        return haystack.toLowerCase().includes(search.toLowerCase());
      })
    : monthTxns;
  const monthTotal = txns.reduce((sum, t) => sum + Number(t.amount), 0);

  const groups = new Map<string, TransactionWithCategory[]>();
  for (const t of txns) {
    const list = groups.get(t.occurred_on) ?? [];
    list.push(t);
    groups.set(t.occurred_on, list);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            {format(monthDate, "MMMM yyyy")} · {formatCurrency(monthTotal)}
          </p>
        </div>
        <TransactionDialog categories={cats} />
      </div>

      <Card className="space-y-4 p-4">
        <MonthNav
          month={monthParam}
          label={format(monthDate, "MMMM yyyy")}
          isCurrent={monthParam === currentMonth}
          basePath="/transactions"
          params={{ q: search, category: categoryFilter }}
        />
        <form method="get" className="grid gap-3">
          <input type="hidden" name="month" value={monthParam} />
          <Input
            name="q"
            type="search"
            placeholder="Search notes or categories"
            defaultValue={search}
          />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Select name="category" defaultValue={categoryFilter}>
              <option value="">All categories</option>
              <option value="__none">Uncategorized</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Button type="submit">Filter</Button>
          </div>
        </form>
      </Card>

      {txns.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 p-10 text-center">
          <p className="font-medium">No matching expenses</p>
          <p className="text-sm text-muted-foreground">
            Adjust your filters or tap &ldquo;Add expense&rdquo; to log one.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          {[...groups.entries()].map(([date, items]) => {
            const dayTotal = items.reduce((sum, t) => sum + Number(t.amount), 0);
            return (
              <div key={date} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold text-muted-foreground">
                    {format(parseISO(date), "EEE, MMM d, yyyy")}
                  </h2>
                  <span className="text-sm font-medium">
                    {formatCurrency(dayTotal)}
                  </span>
                </div>
                <Card className="divide-y">
                  {items.map((t) => (
                    <TransactionRow key={t.id} transaction={t} />
                  ))}
                </Card>
              </div>
            );
          })}
        </div>
      )}
      <TransactionEditManager categories={cats} />
      <TransactionDialog categories={cats} trigger="floating" />
    </div>
  );
}
