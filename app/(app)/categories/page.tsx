import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import { CategoryDialog } from "@/components/category-dialog";
import { DeleteCategoryButton } from "@/components/delete-category-button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("name");
  const categories = (data ?? []) as Category[];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Organize where your money goes.
          </p>
        </div>
        <CategoryDialog />
      </div>

      {categories.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 p-10 text-center">
          <p className="font-medium">No categories</p>
          <p className="text-sm text-muted-foreground">
            Add one to start grouping your expenses.
          </p>
        </Card>
      ) : (
        <Card className="divide-y">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className="size-4 shrink-0 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              <span className="flex-1 truncate text-sm font-medium">
                {c.name}
              </span>
              <div className="flex items-center">
                <CategoryDialog category={c} trigger="icon" />
                <DeleteCategoryButton id={c.id} />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
