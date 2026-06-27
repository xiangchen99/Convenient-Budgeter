"use client";

import * as React from "react";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Pencil } from "lucide-react";
import {
  createTransaction,
  updateTransaction,
  type ActionResult,
} from "@/app/(app)/transactions/actions";
import type { Category, TransactionWithCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";

const INITIAL: ActionResult = { error: null, ok: false };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function TransactionDialog({
  categories,
  transaction,
  trigger,
}: {
  categories: Category[];
  transaction?: TransactionWithCategory;
  trigger?: "button" | "icon";
}) {
  const isEdit = Boolean(transaction);
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState(
    isEdit ? updateTransaction : createTransaction,
    INITIAL
  );

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      {trigger === "icon" ? (
        <button
          onClick={() => setOpen(true)}
          aria-label="Edit expense"
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Pencil className="size-4" />
        </button>
      ) : (
        <Button onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="size-4" />
          Add expense
        </Button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? "Edit expense" : "Add expense"}
      >
        <form action={formAction} className="space-y-4">
          {isEdit && (
            <input type="hidden" name="id" value={transaction!.id} />
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              defaultValue={transaction?.amount ?? ""}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_id">Category</Label>
            <Select
              id="category_id"
              name="category_id"
              defaultValue={transaction?.category_id ?? ""}
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="occurred_on">Date</Label>
            <Input
              id="occurred_on"
              name="occurred_on"
              type="date"
              defaultValue={transaction?.occurred_on ?? todayISO()}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Input
              id="note"
              name="note"
              type="text"
              placeholder="e.g. Lunch with team"
              defaultValue={transaction?.note ?? ""}
            />
          </div>

          {state.error && (
            <p className="text-sm font-medium text-destructive">
              {state.error}
            </p>
          )}

          <SubmitButton label={isEdit ? "Save changes" : "Add expense"} />
        </form>
      </Modal>
    </>
  );
}
