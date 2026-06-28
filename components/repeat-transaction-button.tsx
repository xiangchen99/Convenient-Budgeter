"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { repeatTransaction } from "@/app/(app)/transactions/actions";
import { formatLocalDate } from "@/lib/dates";

export function RepeatTransactionButton({ id }: { id: string }) {
  const localDateRef = React.useRef<HTMLInputElement>(null);

  return (
    <form
      action={repeatTransaction}
      onSubmit={() => {
        if (localDateRef.current) {
          localDateRef.current.value = formatLocalDate();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input
        ref={localDateRef}
        type="hidden"
        name="occurred_on"
        defaultValue={formatLocalDate()}
      />
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
