"use client";

import { RotateCcw } from "lucide-react";
import { repeatTransaction } from "@/app/(app)/transactions/actions";

export function RepeatTransactionButton({ id }: { id: string }) {
  return (
    <form action={repeatTransaction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label="Repeat expense today"
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <RotateCcw className="size-4" />
      </button>
    </form>
  );
}
