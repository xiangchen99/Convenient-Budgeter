import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { Category, TransactionWithCategory } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { TransactionDialog } from "@/components/transaction-dialog";
import { DeleteTransactionButton } from "@/components/delete-transaction-button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: transactions }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase
      .from("transactions")
      .select("*, category:categories(id, name, color)")
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const cats = (categories ?? []) as Category[];
  const txns = (transactions ?? []) as unknown as TransactionWithCategory[];

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
            {txns.length} recent {txns.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <TransactionDialog categories={cats} />
      </div>

      {txns.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 p-10 text-center">
          <p className="font-medium">No expenses yet</p>
          <p className="text-sm text-muted-foreground">
            Tap &ldquo;Add expense&rdquo; to log your first one.
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
                    <div
                      key={t.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: t.category?.color ?? "#94a3b8",
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {t.category?.name ?? "Uncategorized"}
                        </p>
                        {t.note && (
                          <p className="truncate text-xs text-muted-foreground">
                            {t.note}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatCurrency(Number(t.amount))}
                      </span>
                      <div className="flex items-center">
                        <TransactionDialog
                          categories={cats}
                          transaction={t}
                          trigger="icon"
                        />
                        <DeleteTransactionButton id={t.id} />
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
