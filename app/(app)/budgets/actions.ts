"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWeekStartString } from "@/lib/budgets";
import type { BudgetPeriod } from "@/lib/types";

export type BudgetActionResult = { error: string | null; ok: boolean };

const VALID_PERIODS = new Set<BudgetPeriod>(["daily", "weekly", "monthly"]);

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

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
  const { supabase, user } = await requireUser();
  const period = parsePeriod(formData.get("period"));
  const amount = parseAmount(formData.get("amount"));

  if (!period) return { error: "Choose a valid budget period.", ok: false };
  if (amount === null) return { error: "Enter a valid budget amount.", ok: false };

  const { error } = await supabase.from("budgets").upsert(
    {
      user_id: user.id,
      period,
      amount,
    },
    { onConflict: "user_id,period" }
  );

  if (error) return { error: error.message, ok: false };

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { error: null, ok: true };
}

export async function deleteBudget(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const period = parsePeriod(formData.get("period"));
  if (!period) return;

  await supabase
    .from("budgets")
    .delete()
    .eq("user_id", user.id)
    .eq("period", period);

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}

export async function upsertWeeklyBudgetOverride(
  _prev: BudgetActionResult,
  formData: FormData
): Promise<BudgetActionResult> {
  const { supabase, user } = await requireUser();
  const week_start = parseWeekStart(formData.get("week_start"));
  const amount = parseAmount(formData.get("amount"));

  if (!week_start) return { error: "Choose a valid week.", ok: false };
  if (amount === null) return { error: "Enter a valid budget amount.", ok: false };

  const { error } = await supabase.from("weekly_budget_overrides").upsert(
    {
      user_id: user.id,
      week_start,
      amount,
    },
    { onConflict: "user_id,week_start" }
  );

  if (error) return { error: error.message, ok: false };

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { error: null, ok: true };
}

export async function deleteWeeklyBudgetOverride(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const week_start = parseWeekStart(formData.get("week_start"));
  if (!week_start) return;

  await supabase
    .from("weekly_budget_overrides")
    .delete()
    .eq("user_id", user.id)
    .eq("week_start", week_start);

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}
