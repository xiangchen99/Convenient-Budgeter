import { getCategories } from "@/lib/app-data";
import { CategoryDialog } from "@/components/category-dialog";
import { CategoryList } from "@/components/category-list";
import { Card } from "@/components/ui/card";

export default async function CategoriesPage() {
  const categories = await getCategories();

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
        <CategoryList categories={categories} />
      )}
    </div>
  );
}
