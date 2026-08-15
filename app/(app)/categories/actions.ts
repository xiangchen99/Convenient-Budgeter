"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/db/auth";

export type ActionResult = { error: string | null; ok: boolean };

function normalizeColor(raw: FormDataEntryValue | null): string {
  const value = String(raw ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#16a34a";
}

export async function createCategory(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const color = normalizeColor(formData.get("color"));

  if (!name) return { error: "Name is required.", ok: false };

  try {
    const db = await getDb();
    const id = crypto.randomUUID();
    await db
      .prepare(
        "INSERT INTO categories (id, user_id, name, color) VALUES (?, ?, ?, ?)"
      )
      .bind(id, user.id, name, color)
      .run();
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE") || message.includes("constraint")) {
      return { error: "That category already exists.", ok: false };
    }
    return { error: message || "Failed to create category.", ok: false };
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
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const color = normalizeColor(formData.get("color"));

  if (!id) return { error: "Missing category id.", ok: false };
  if (!name) return { error: "Name is required.", ok: false };

  try {
    const db = await getDb();
    await db
      .prepare(
        "UPDATE categories SET name = ?, color = ? WHERE id = ? AND user_id = ?"
      )
      .bind(name, color, id, user.id)
      .run();
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE") || message.includes("constraint")) {
      return { error: "That category already exists.", ok: false };
    }
    return { error: message || "Failed to update category.", ok: false };
  }

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { error: null, ok: true };
}

export async function deleteCategory(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const db = await getDb();
  // Set referencing transactions and templates category_id to NULL
  await db.batch([
    db
      .prepare(
        "UPDATE transactions SET category_id = NULL WHERE category_id = ? AND user_id = ?"
      )
      .bind(id, user.id),
    db
      .prepare(
        "UPDATE expense_templates SET category_id = NULL WHERE category_id = ? AND user_id = ?"
      )
      .bind(id, user.id),
    db
      .prepare("DELETE FROM categories WHERE id = ? AND user_id = ?")
      .bind(id, user.id),
  ]);

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}
