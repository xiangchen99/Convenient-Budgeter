"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteWeeklyBudgetOverride,
  upsertWeeklyBudgetOverride,
  type BudgetActionResult,
} from "@/app/(app)/budgets/actions";
import type { WeeklyBudgetOverride } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL: BudgetActionResult = { error: null, ok: false };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save weekly override"}
    </Button>
  );
}

function ClearButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      onClick={(event) => {
        if (!confirm("Clear this weekly budget override?")) {
          event.preventDefault();
        }
      }}
    >
      {pending ? "Clearing..." : "Clear override"}
    </Button>
  );
}

export function WeeklyBudgetOverrideForm({
  weekStart,
  rangeLabel,
  defaultAmount,
  override,
}: {
  weekStart: string;
  rangeLabel: string;
  defaultAmount: number | null;
  override: WeeklyBudgetOverride | null;
}) {
  const [state, formAction] = useActionState(
    upsertWeeklyBudgetOverride,
    INITIAL
  );
  const overrideAmount = override ? Number(override.amount) : null;

  return (
    <div className="space-y-4 rounded-xl border bg-background p-4">
      <div>
        <h2 className="text-base font-semibold">Specific week budget</h2>
        <p className="text-sm text-muted-foreground">
          Override the default weekly budget for one Monday-starting week.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Default weekly budget:{" "}
          {defaultAmount === null ? "Not set" : formatCurrency(defaultAmount)}
        </p>
      </div>

      <form method="get" className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="weekly-override-week">Week</Label>
          <Input
            id="weekly-override-week"
            name="week"
            type="date"
            defaultValue={weekStart}
            required
          />
        </div>
        <Button type="submit" variant="outline" className="self-end">
          View week
        </Button>
      </form>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="week_start" value={weekStart} />
        <div className="space-y-2">
          <Label htmlFor="weekly-override-amount">
            Override amount for {rangeLabel}
          </Label>
          <Input
            id="weekly-override-amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder={defaultAmount === null ? "0.00" : String(defaultAmount)}
            defaultValue={overrideAmount ?? ""}
            required
          />
        </div>
        {state.error && (
          <p className="text-sm font-medium text-destructive">{state.error}</p>
        )}
        {state.ok && (
          <p className="text-sm font-medium text-primary">
            Weekly override saved.
          </p>
        )}
        <SaveButton />
      </form>

      {override && (
        <form action={deleteWeeklyBudgetOverride}>
          <input type="hidden" name="week_start" value={weekStart} />
          <ClearButton />
        </form>
      )}
    </div>
  );
}
