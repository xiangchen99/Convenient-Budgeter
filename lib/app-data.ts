import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Budget, Category } from "@/lib/types";

export const getCategories = cache(async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, user_id, name, color, created_at")
    .order("name");

  return (data ?? []) as Category[];
});

export const getBudgets = cache(async function getBudgets() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("budgets")
    .select("id, user_id, period, amount, created_at, updated_at")
    .order("period");

  return (data ?? []) as unknown as Budget[];
});
