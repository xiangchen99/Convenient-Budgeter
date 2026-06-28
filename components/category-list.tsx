"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import type { Category } from "@/lib/types";
import { CategoryDialog } from "@/components/category-dialog";
import { DeleteCategoryButton } from "@/components/delete-category-button";
import { Card } from "@/components/ui/card";

export function CategoryList({ categories }: { categories: Category[] }) {
  const [selectedCategory, setSelectedCategory] =
    React.useState<Category | null>(null);

  return (
    <>
      <Card className="divide-y">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center gap-3 px-4 py-3">
            <span
              className="size-4 shrink-0 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="flex-1 truncate text-sm font-medium">
              {category.name}
            </span>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setSelectedCategory(category)}
                aria-label="Edit category"
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Pencil className="size-4" />
              </button>
              <DeleteCategoryButton id={category.id} />
            </div>
          </div>
        ))}
      </Card>
      {selectedCategory && (
        <CategoryDialog
          key={selectedCategory.id}
          category={selectedCategory}
          trigger="none"
          open
          onOpenChange={(open) => {
            if (!open) setSelectedCategory(null);
          }}
        />
      )}
    </>
  );
}
