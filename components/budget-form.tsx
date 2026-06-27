"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteBudget,
  upsertBudget,
  type BudgetActionResult,
} from "@/app/(app)/budgets/actions";
import { BUDGET_DESCRIPTIONS, BUDGET_LABELS } from "@/lib/budgets";
import type { Budget, BudgetPeriod } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL: BudgetActionResult = { error: null, ok: false };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save"}
    </Button>
  );
}

function ClearButton({ period }: { period: BudgetPeriod }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      onClick={(event) => {
        if (!confirm(`Clear your ${BUDGET_LABELS[period].toLowerCase()} budget?`)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? "Clearing..." : "Clear"}
    </Button>
  );
}

export function BudgetForm({
  period,
  budget,
  rangeLabel,
}: {
  period: BudgetPeriod;
  budget: Budget | null;
  rangeLabel: string;
}) {
  const [state, formAction] = useActionState(upsertBudget, INITIAL);
  const currentAmount = budget ? Number(budget.amount) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{BUDGET_LABELS[period]}</h2>
          <p className="text-sm text-muted-foreground">
            {BUDGET_DESCRIPTIONS[period]}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{rangeLabel}</p>
        </div>
        {currentAmount !== null && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {formatCurrency(currentAmount)}
          </span>
        )}
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="period" value={period} />
        <div className="space-y-2">
          <Label htmlFor={`${period}-amount`}>Budget amount</Label>
          <Input
            id={`${period}-amount`}
            name="amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            defaultValue={currentAmount ?? ""}
            required
          />
        </div>
        {state.error && (
          <p className="text-sm font-medium text-destructive">{state.error}</p>
        )}
        {state.ok && (
          <p className="text-sm font-medium text-primary">Budget saved.</p>
        )}
        <SaveButton />
      </form>

      {budget && (
        <form action={deleteBudget}>
          <input type="hidden" name="period" value={period} />
          <ClearButton period={period} />
        </form>
      )}
    </div>
  );
}
