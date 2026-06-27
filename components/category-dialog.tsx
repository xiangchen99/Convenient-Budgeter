"use client";

import * as React from "react";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Pencil } from "lucide-react";
import {
  createCategory,
  updateCategory,
  type ActionResult,
} from "@/app/(app)/categories/actions";
import type { Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";

const INITIAL: ActionResult = { error: null, ok: false };

const PRESET_COLORS = [
  "#16a34a",
  "#0d9488",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#dc2626",
  "#d97706",
  "#64748b",
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function CategoryDialog({
  category,
  trigger,
}: {
  category?: Category;
  trigger?: "button" | "icon";
}) {
  const isEdit = Boolean(category);
  const [open, setOpen] = React.useState(false);
  const [color, setColor] = React.useState(category?.color ?? PRESET_COLORS[0]);
  const [state, formAction] = useActionState(
    isEdit ? updateCategory : createCategory,
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
          aria-label="Edit category"
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Pencil className="size-4" />
        </button>
      ) : (
        <Button onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="size-4" />
          Add category
        </Button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? "Edit category" : "Add category"}
      >
        <form action={formAction} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={category!.id} />}
          <input type="hidden" name="color" value={color} />

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Coffee"
              defaultValue={category?.name ?? ""}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Select color ${c}`}
                  className="size-8 rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline:
                      color.toLowerCase() === c.toLowerCase()
                        ? "2px solid hsl(var(--ring))"
                        : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>

          {state.error && (
            <p className="text-sm font-medium text-destructive">
              {state.error}
            </p>
          )}

          <SubmitButton label={isEdit ? "Save changes" : "Add category"} />
        </form>
      </Modal>
    </>
  );
}
