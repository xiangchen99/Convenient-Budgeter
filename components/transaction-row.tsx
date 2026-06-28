import type { TransactionWithCategory } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { TransactionRowActions } from "@/components/transaction-row-actions";

export function TransactionRow({
  transaction,
}: {
  transaction: TransactionWithCategory;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50">
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{
          backgroundColor: transaction.category?.color ?? "#94a3b8",
        }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {transaction.category?.name ?? "Uncategorized"}
        </p>
        {transaction.note && (
          <p className="truncate text-xs text-muted-foreground">
            {transaction.note}
          </p>
        )}
        {transaction.split_days > 1 && (
          <p className="text-xs font-medium text-primary">
            Split {transaction.split_days} days
          </p>
        )}
      </div>
      <span className="text-sm font-semibold tabular-nums">
        {formatCurrency(Number(transaction.amount))}
      </span>
      <TransactionRowActions transaction={transaction} />
    </div>
  );
}
