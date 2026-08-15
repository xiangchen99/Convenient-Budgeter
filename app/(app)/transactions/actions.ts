"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/db/auth";
import { formatLocalDate } from "@/lib/dates";
import { getNextWeekStartString } from "@/lib/budgets";

export type ActionResult = { error: string | null; ok: boolean };

function parseAmount(raw: FormDataEntryValue | null): number | null {
  const value = Number.parseFloat(String(raw ?? ""));
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100) / 100;
}

function parseDateString(raw: FormDataEntryValue | null): string {
  const value = String(raw ?? "");
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : formatLocalDate();
}

function parseSplitDays(raw: FormDataEntryValue | null): number {
  const value = Number.parseInt(String(raw ?? "1"), 10);
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(value, 1), 365);
}

function parseName(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? "").trim();
  return value ? value.slice(0, 80) : null;
}

function shouldCarryToNextWeek(raw: FormDataEntryValue | null) {
  return raw === "on" || raw === "true";
}

export async function createTransaction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();

  const amount = parseAmount(formData.get("amount"));
  const occurred_on = String(formData.get("occurred_on") ?? "");
  const categoryRaw = String(formData.get("category_id") ?? "");
  const split_days = parseSplitDays(formData.get("split_days"));
  const weekly_budget_start = shouldCarryToNextWeek(
    formData.get("carry_to_next_week")
  )
    ? getNextWeekStartString(occurred_on)
    : null;
  const note = String(formData.get("note") ?? "").trim();

  if (amount === null) return { error: "Enter a valid amount.", ok: false };
  if (!occurred_on) return { error: "Pick a date.", ok: false };

  try {
    const db = await getDb();
    const id = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO transactions (id, user_id, amount, occurred_on, split_days, weekly_budget_start, category_id, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        user.id,
        amount,
        occurred_on,
        split_days,
        weekly_budget_start,
        categoryRaw || null,
        note || null
      )
      .run();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create transaction.";
    return { error: message, ok: false };
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { error: null, ok: true };
}

export async function updateTransaction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();

  const id = String(formData.get("id") ?? "");
  const amount = parseAmount(formData.get("amount"));
  const occurred_on = String(formData.get("occurred_on") ?? "");
  const categoryRaw = String(formData.get("category_id") ?? "");
  const split_days = parseSplitDays(formData.get("split_days"));
  const weekly_budget_start = shouldCarryToNextWeek(
    formData.get("carry_to_next_week")
  )
    ? getNextWeekStartString(occurred_on)
    : null;
  const note = String(formData.get("note") ?? "").trim();

  if (!id) return { error: "Missing transaction id.", ok: false };
  if (amount === null) return { error: "Enter a valid amount.", ok: false };
  if (!occurred_on) return { error: "Pick a date.", ok: false };

  try {
    const db = await getDb();
    await db
      .prepare(
        `UPDATE transactions
         SET amount = ?, occurred_on = ?, split_days = ?, weekly_budget_start = ?, category_id = ?, note = ?
         WHERE id = ? AND user_id = ?`
      )
      .bind(
        amount,
        occurred_on,
        split_days,
        weekly_budget_start,
        categoryRaw || null,
        note || null,
        id,
        user.id
      )
      .run();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update transaction.";
    return { error: message, ok: false };
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { error: null, ok: true };
}

export async function deleteTransaction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const db = await getDb();
  await db
    .prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?")
    .bind(id, user.id)
    .run();

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function repeatTransaction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const occurred_on = parseDateString(formData.get("occurred_on"));
  if (!id) return;

  const db = await getDb();
  const original = await db
    .prepare(
      "SELECT amount, category_id, note, split_days FROM transactions WHERE id = ? AND user_id = ?"
    )
    .bind(id, user.id)
    .first<{
      amount: number;
      category_id: string | null;
      note: string | null;
      split_days: number;
    }>();

  if (!original) return;

  const newId = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO transactions (id, user_id, amount, category_id, note, split_days, weekly_budget_start, occurred_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      newId,
      user.id,
      Number(original.amount),
      original.category_id,
      original.note,
      Number(original.split_days) || 1,
      null,
      occurred_on
    )
    .run();

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function createExpenseTemplate(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();

  const name = parseName(formData.get("name"));
  const amount = parseAmount(formData.get("amount"));
  const categoryRaw = String(formData.get("category_id") ?? "");
  const split_days = parseSplitDays(formData.get("split_days"));
  const note = String(formData.get("note") ?? "").trim();

  if (!name) return { error: "Enter a template name.", ok: false };
  if (amount === null) return { error: "Enter a valid amount.", ok: false };

  try {
    const db = await getDb();
    const id = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO expense_templates (id, user_id, name, amount, category_id, split_days, note)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        user.id,
        name,
        amount,
        categoryRaw || null,
        split_days,
        note || null
      )
      .run();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create template.";
    return { error: message, ok: false };
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { error: null, ok: true };
}

export async function updateExpenseTemplate(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();

  const id = String(formData.get("id") ?? "");
  const name = parseName(formData.get("name"));
  const amount = parseAmount(formData.get("amount"));
  const categoryRaw = String(formData.get("category_id") ?? "");
  const split_days = parseSplitDays(formData.get("split_days"));
  const note = String(formData.get("note") ?? "").trim();

  if (!id) return { error: "Missing template id.", ok: false };
  if (!name) return { error: "Enter a template name.", ok: false };
  if (amount === null) return { error: "Enter a valid amount.", ok: false };

  try {
    const db = await getDb();
    await db
      .prepare(
        `UPDATE expense_templates
         SET name = ?, amount = ?, category_id = ?, split_days = ?, note = ?, updated_at = datetime('now')
         WHERE id = ? AND user_id = ?`
      )
      .bind(
        name,
        amount,
        categoryRaw || null,
        split_days,
        note || null,
        id,
        user.id
      )
      .run();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update template.";
    return { error: message, ok: false };
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { error: null, ok: true };
}

export async function deleteExpenseTemplate(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const db = await getDb();
  await db
    .prepare("DELETE FROM expense_templates WHERE id = ? AND user_id = ?")
    .bind(id, user.id)
    .run();

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

export async function createTransactionFromTemplate(
  formData: FormData
): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const occurred_on = parseDateString(formData.get("occurred_on"));
  if (!id) return;

  const db = await getDb();
  const template = await db
    .prepare(
      "SELECT amount, category_id, note, split_days FROM expense_templates WHERE id = ? AND user_id = ?"
    )
    .bind(id, user.id)
    .first<{
      amount: number;
      category_id: string | null;
      note: string | null;
      split_days: number;
    }>();

  if (!template) return;

  const newId = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO transactions (id, user_id, amount, category_id, note, split_days, weekly_budget_start, occurred_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      newId,
      user.id,
      Number(template.amount),
      template.category_id,
      template.note,
      Number(template.split_days) || 1,
      null,
      occurred_on
    )
    .run();

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}
