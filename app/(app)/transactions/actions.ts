"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatLocalDate } from "@/lib/dates";

export type ActionResult = { error: string | null; ok: boolean };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

function parseAmount(raw: FormDataEntryValue | null): number | null {
  const value = Number.parseFloat(String(raw ?? ""));
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100) / 100;
}

function parseDateString(raw: FormDataEntryValue | null): string {
  const value = String(raw ?? "");
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : formatLocalDate();
}

export async function createTransaction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const amount = parseAmount(formData.get("amount"));
  const occurred_on = String(formData.get("occurred_on") ?? "");
  const categoryRaw = String(formData.get("category_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (amount === null) return { error: "Enter a valid amount.", ok: false };
  if (!occurred_on) return { error: "Pick a date.", ok: false };

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    amount,
    occurred_on,
    category_id: categoryRaw || null,
    note: note || null,
  });

  if (error) return { error: error.message, ok: false };

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { error: null, ok: true };
}

export async function updateTransaction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const id = String(formData.get("id") ?? "");
  const amount = parseAmount(formData.get("amount"));
  const occurred_on = String(formData.get("occurred_on") ?? "");
  const categoryRaw = String(formData.get("category_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!id) return { error: "Missing transaction id.", ok: false };
  if (amount === null) return { error: "Enter a valid amount.", ok: false };
  if (!occurred_on) return { error: "Pick a date.", ok: false };

  const { error } = await supabase
    .from("transactions")
    .update({
      amount,
      occurred_on,
      category_id: categoryRaw || null,
      note: note || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message, ok: false };

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { error: null, ok: true };
}

export async function deleteTransaction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function repeatTransaction(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const occurred_on = parseDateString(formData.get("occurred_on"));
  if (!id) return;

  const { data: original } = await supabase
    .from("transactions")
    .select("amount, category_id, note")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!original) return;

  await supabase.from("transactions").insert({
    user_id: user.id,
    amount: Number(original.amount),
    category_id: original.category_id,
    note: original.note,
    occurred_on,
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}
