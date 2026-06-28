"use client";

import type { TransactionWithCategory } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { DeleteTransactionButton } from "@/components/delete-transaction-button";
import { RepeatTransactionButton } from "@/components/repeat-transaction-button";
import {
  EditTransactionButton,
  openTransactionEditor,
} from "@/components/transaction-edit-manager";

export function TransactionRow({
  transaction,
}: {
  transaction: TransactionWithCategory;
}) {
  const openEditor = () => openTransactionEditor(transaction);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openEditor}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openEditor();
        }
      }}
      aria-label={`Edit ${transaction.category?.name ?? "Uncategorized"} expense`}
      className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
    >
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
      <div
        className="flex items-center"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <RepeatTransactionButton id={transaction.id} />
        <EditTransactionButton transaction={transaction} />
        <DeleteTransactionButton id={transaction.id} />
      </div>
    </div>
  );
}
