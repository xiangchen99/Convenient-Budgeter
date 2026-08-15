"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/db/auth";
import { getWeekStartString } from "@/lib/budgets";
import type { BudgetPeriod } from "@/lib/types";

export type BudgetActionResult = { error: string | null; ok: boolean };

const VALID_PERIODS = new Set<BudgetPeriod>(["daily", "weekly", "monthly"]);

function parsePeriod(raw: FormDataEntryValue | null): BudgetPeriod | null {
  const value = String(raw ?? "");
  return VALID_PERIODS.has(value as BudgetPeriod)
    ? (value as BudgetPeriod)
    : null;
}

function parseAmount(raw: FormDataEntryValue | null): number | null {
  const value = Number.parseFloat(String(raw ?? ""));
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100) / 100;
}

function parseWeekStart(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return getWeekStartString(value);
}

export async function upsertBudget(
  _prev: BudgetActionResult,
  formData: FormData
): Promise<BudgetActionResult> {
  const user = await requireUser();
  const period = parsePeriod(formData.get("period"));
  const amount = parseAmount(formData.get("amount"));

  if (!period) return { error: "Choose a valid budget period.", ok: false };
  if (amount === null) return { error: "Enter a valid budget amount.", ok: false };

  try {
    const db = await getDb();
    const id = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO budgets (id, user_id, period, amount, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT(user_id, period) DO UPDATE SET
           amount = excluded.amount,
           updated_at = datetime('now')`
      )
      .bind(id, user.id, period, amount)
      .run();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update budget.";
    return { error: message, ok: false };
  }

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { error: null, ok: true };
}

export async function deleteBudget(formData: FormData): Promise<void> {
  const user = await requireUser();
  const period = parsePeriod(formData.get("period"));
  if (!period) return;

  const db = await getDb();
  await db
    .prepare("DELETE FROM budgets WHERE user_id = ? AND period = ?")
    .bind(user.id, period)
    .run();

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}

export async function upsertWeeklyBudgetOverride(
  _prev: BudgetActionResult,
  formData: FormData
): Promise<BudgetActionResult> {
  const user = await requireUser();
  const week_start = parseWeekStart(formData.get("week_start"));
  const amount = parseAmount(formData.get("amount"));

  if (!week_start) return { error: "Choose a valid week.", ok: false };
  if (amount === null) return { error: "Enter a valid budget amount.", ok: false };

  try {
    const db = await getDb();
    const id = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO weekly_budget_overrides (id, user_id, week_start, amount, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT(user_id, week_start) DO UPDATE SET
           amount = excluded.amount,
           updated_at = datetime('now')`
      )
      .bind(id, user.id, week_start, amount)
      .run();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update weekly override.";
    return { error: message, ok: false };
  }

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { error: null, ok: true };
}

export async function deleteWeeklyBudgetOverride(
  formData: FormData
): Promise<void> {
  const user = await requireUser();
  const week_start = parseWeekStart(formData.get("week_start"));
  if (!week_start) return;

  const db = await getDb();
  await db
    .prepare(
      "DELETE FROM weekly_budget_overrides WHERE user_id = ? AND week_start = ?"
    )
    .bind(user.id, week_start)
    .run();

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}
