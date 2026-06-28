"use client";

import { Pencil } from "lucide-react";
import type { TransactionWithCategory } from "@/lib/types";
import { DeleteTransactionButton } from "@/components/delete-transaction-button";
import { RepeatTransactionButton } from "@/components/repeat-transaction-button";
import { openTransactionEditor } from "@/components/transaction-edit-events";

export function TransactionRowActions({
  transaction,
}: {
  transaction: TransactionWithCategory;
}) {
  return (
    <div
      className="flex items-center"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <RepeatTransactionButton id={transaction.id} />
      <button
        type="button"
        onClick={() => openTransactionEditor(transaction)}
        aria-label="Edit expense"
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Pencil className="size-4" />
      </button>
      <DeleteTransactionButton id={transaction.id} />
    </div>
  );
}
