"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import type { Category } from "@/lib/types";
import { Button } from "@/components/ui/button";

const TransactionDialog = dynamic(
  () =>
    import("@/components/transaction-dialog").then(
      (mod) => mod.TransactionDialog
    ),
  { ssr: false }
);

export function LazyTransactionDialog({
  categories,
  trigger = "button",
}: {
  categories: Category[];
  trigger?: "button" | "floating" | "both";
}) {
  const [open, setOpen] = React.useState(false);
  const [shouldLoad, setShouldLoad] = React.useState(false);

  const openDialog = () => {
    setShouldLoad(true);
    setOpen(true);
  };

  return (
    <>
      {(trigger === "button" || trigger === "both") && (
        <Button type="button" onClick={openDialog} className="gap-1.5">
          <Plus className="size-4" />
          Add expense
        </Button>
      )}
      {(trigger === "floating" || trigger === "both") && (
        <Button
          type="button"
          onClick={openDialog}
          className="fixed bottom-20 right-4 z-30 h-14 rounded-full px-5 shadow-lg sm:hidden"
          aria-label="Add expense"
        >
          <Plus className="size-5" />
          Add
        </Button>
      )}
      {shouldLoad && (
        <TransactionDialog
          categories={categories}
          trigger="none"
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}
