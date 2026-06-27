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
const LAST_CATEGORY_KEY = "convenient-budgeter:last-category-id";

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
  trigger?: "button" | "icon" | "floating";
}) {
  const isEdit = Boolean(transaction);
  const [open, setOpen] = React.useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState(
    transaction?.category_id ?? ""
  );
  const [state, formAction] = useActionState(
    isEdit ? updateTransaction : createTransaction,
    INITIAL
  );

  useEffect(() => {
    if (!open) return;
    if (transaction) {
      setSelectedCategoryId(transaction.category_id ?? "");
      return;
    }
    const lastCategoryId = window.localStorage.getItem(LAST_CATEGORY_KEY);
    if (lastCategoryId && categories.some((c) => c.id === lastCategoryId)) {
      setSelectedCategoryId(lastCategoryId);
    }
  }, [categories, open, transaction]);

  useEffect(() => {
    if (!state.ok) return;
    if (selectedCategoryId) {
      window.localStorage.setItem(LAST_CATEGORY_KEY, selectedCategoryId);
    } else {
      window.localStorage.removeItem(LAST_CATEGORY_KEY);
    }
    setOpen(false);
  }, [selectedCategoryId, state.ok]);

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
      ) : trigger === "floating" ? (
        <Button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-30 h-14 rounded-full px-5 shadow-lg sm:hidden"
          aria-label="Add expense"
        >
          <Plus className="size-5" />
          Add
        </Button>
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
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              <CategoryChip
                active={selectedCategoryId === ""}
                label="Uncategorized"
                onClick={() => setSelectedCategoryId("")}
              />
              {categories.map((c) => (
                <CategoryChip
                  key={c.id}
                  active={selectedCategoryId === c.id}
                  label={c.name}
                  color={c.color}
                  onClick={() => setSelectedCategoryId(c.id)}
                />
              ))}
            </div>
            <Select
              id="category_id"
              name="category_id"
              value={selectedCategoryId}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
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

function CategoryChip({
  active,
  label,
  color,
  onClick,
}: {
  active: boolean;
  label: string;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
      ].join(" ")}
    >
      {color && (
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </button>
  );
}
