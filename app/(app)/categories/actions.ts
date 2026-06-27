"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string | null; ok: boolean };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

function normalizeColor(raw: FormDataEntryValue | null): string {
  const value = String(raw ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#16a34a";
}

export async function createCategory(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const color = normalizeColor(formData.get("color"));

  if (!name) return { error: "Name is required.", ok: false };

  const { error } = await supabase
    .from("categories")
    .insert({ user_id: user.id, name, color });

  if (error) {
    return {
      error: error.code === "23505" ? "That category already exists." : error.message,
      ok: false,
    };
  }

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { error: null, ok: true };
}

export async function updateCategory(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const color = normalizeColor(formData.get("color"));

  if (!id) return { error: "Missing category id.", ok: false };
  if (!name) return { error: "Name is required.", ok: false };

  const { error } = await supabase
    .from("categories")
    .update({ name, color })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return {
      error: error.code === "23505" ? "That category already exists." : error.message,
      ok: false,
    };
  }

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { error: null, ok: true };
}

export async function deleteCategory(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Transactions referencing this category are set to null via FK on delete.
  await supabase.from("categories").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}
