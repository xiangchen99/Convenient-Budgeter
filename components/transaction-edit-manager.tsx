"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import type { Category, TransactionWithCategory } from "@/lib/types";
import { TransactionDialog } from "@/components/transaction-dialog";

const EDIT_TRANSACTION_EVENT = "convenient-budgeter:edit-transaction";

export function openTransactionEditor(transaction: TransactionWithCategory) {
  window.dispatchEvent(
    new CustomEvent<TransactionWithCategory>(EDIT_TRANSACTION_EVENT, {
      detail: transaction,
    })
  );
}

export function EditTransactionButton({
  transaction,
}: {
  transaction: TransactionWithCategory;
}) {
  return (
    <button
      onClick={() => openTransactionEditor(transaction)}
      aria-label="Edit expense"
      className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <Pencil className="size-4" />
    </button>
  );
}

export function TransactionEditManager({
  categories,
}: {
  categories: Category[];
}) {
  const [transaction, setTransaction] =
    React.useState<TransactionWithCategory | null>(null);

  React.useEffect(() => {
    const handler = (event: Event) => {
      setTransaction(
        (event as CustomEvent<TransactionWithCategory>).detail ?? null
      );
    };
    window.addEventListener(EDIT_TRANSACTION_EVENT, handler);
    return () => window.removeEventListener(EDIT_TRANSACTION_EVENT, handler);
  }, []);

  if (!transaction) return null;

  return (
    <TransactionDialog
      key={transaction.id}
      categories={categories}
      transaction={transaction}
      trigger="none"
      open
      onOpenChange={(open) => {
        if (!open) setTransaction(null);
      }}
    />
  );
}
