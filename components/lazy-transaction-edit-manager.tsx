"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { Category, TransactionWithCategory } from "@/lib/types";
import { EDIT_TRANSACTION_EVENT } from "@/components/transaction-edit-events";

const TransactionDialog = dynamic(
  () =>
    import("@/components/transaction-dialog").then(
      (mod) => mod.TransactionDialog
    ),
  { ssr: false }
);

export function LazyTransactionEditManager({
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
