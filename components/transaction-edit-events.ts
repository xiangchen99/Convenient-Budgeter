"use client";

import type { TransactionWithCategory } from "@/lib/types";

export const EDIT_TRANSACTION_EVENT = "convenient-budgeter:edit-transaction";

export function openTransactionEditor(transaction: TransactionWithCategory) {
  window.dispatchEvent(
    new CustomEvent<TransactionWithCategory>(EDIT_TRANSACTION_EVENT, {
      detail: transaction,
    })
  );
}
