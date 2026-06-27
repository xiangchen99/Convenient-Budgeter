"use client";

import { Trash2 } from "lucide-react";
import { deleteTransaction } from "@/app/(app)/transactions/actions";

export function DeleteTransactionButton({ id }: { id: string }) {
  return (
    <form
      action={deleteTransaction}
      onSubmit={(e) => {
        if (!confirm("Delete this expense?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label="Delete expense"
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    </form>
  );
}
