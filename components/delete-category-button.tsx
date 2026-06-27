"use client";

import { Trash2 } from "lucide-react";
import { deleteCategory } from "@/app/(app)/categories/actions";

export function DeleteCategoryButton({ id }: { id: string }) {
  return (
    <form
      action={deleteCategory}
      onSubmit={(e) => {
        if (
          !confirm(
            "Delete this category? Existing expenses will become uncategorized."
          )
        )
          e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label="Delete category"
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    </form>
  );
}
