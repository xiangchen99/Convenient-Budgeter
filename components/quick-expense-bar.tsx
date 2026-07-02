"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Settings } from "lucide-react";
import {
  createExpenseTemplate,
  createTransactionFromTemplate,
  deleteExpenseTemplate,
  updateExpenseTemplate,
  type ActionResult,
} from "@/app/(app)/transactions/actions";
import { formatLocalDate } from "@/lib/dates";
import type {
  Category,
  ExpenseTemplateWithCategory,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

const INITIAL: ActionResult = { error: null, ok: false };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

function QuickAddSubmitButton({
  template,
}: {
  template: ExpenseTemplateWithCategory;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      className="h-auto shrink-0 flex-col items-start gap-0 px-3 py-2"
      disabled={pending}
      aria-label={`Add ${template.name} today`}
    >
      <span className="text-sm font-semibold">{template.name}</span>
      <span className="text-xs text-muted-foreground">
        {formatCurrency(Number(template.amount))}
        {template.category ? ` · ${template.category.name}` : ""}
      </span>
    </Button>
  );
}

function QuickExpenseButton({
  template,
}: {
  template: ExpenseTemplateWithCategory;
}) {
  const localDateRef = React.useRef<HTMLInputElement>(null);

  return (
    <form
      action={createTransactionFromTemplate}
      onSubmit={() => {
        if (localDateRef.current) {
          localDateRef.current.value = formatLocalDate();
        }
      }}
    >
      <input type="hidden" name="id" value={template.id} />
      <input
        ref={localDateRef}
        type="hidden"
        name="occurred_on"
        defaultValue={formatLocalDate()}
      />
      <QuickAddSubmitButton template={template} />
    </form>
  );
}

function CategorySelect({
  categories,
  defaultValue,
  id,
}: {
  categories: Category[];
  defaultValue?: string | null;
  id: string;
}) {
  return (
    <Select id={id} name="category_id" defaultValue={defaultValue ?? ""}>
      <option value="">Uncategorized</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </Select>
  );
}

function TemplateFields({
  categories,
  idPrefix,
  template,
}: {
  categories: Category[];
  idPrefix: string;
  template?: ExpenseTemplateWithCategory;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-name`}>Name</Label>
          <Input
            id={`${idPrefix}-name`}
            name="name"
            placeholder="Morning subway"
            defaultValue={template?.name ?? ""}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-amount`}>Amount</Label>
          <Input
            id={`${idPrefix}-amount`}
            name="amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            defaultValue={template?.amount ?? ""}
            required
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-category`}>Category</Label>
          <CategorySelect
            id={`${idPrefix}-category`}
            categories={categories}
            defaultValue={template?.category_id}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-split-days`}>Split over days</Label>
          <Input
            id={`${idPrefix}-split-days`}
            name="split_days"
            type="number"
            inputMode="numeric"
            min="1"
            max="365"
            step="1"
            defaultValue={template?.split_days ?? 1}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-note`}>Note (optional)</Label>
        <Input
          id={`${idPrefix}-note`}
          name="note"
          placeholder="e.g. Weekday commute"
          defaultValue={template?.note ?? ""}
        />
      </div>
    </>
  );
}

function CreateTemplateForm({ categories }: { categories: Category[] }) {
  const [state, formAction] = useActionState(createExpenseTemplate, INITIAL);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border p-3">
      <h3 className="text-sm font-semibold">New quick expense</h3>
      <TemplateFields categories={categories} idPrefix="new-template" />
      {state.error && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}
      {state.ok && (
        <p className="text-sm font-medium text-primary">Template saved.</p>
      )}
      <SubmitButton label="Add template" />
    </form>
  );
}

function TemplateEditForm({
  categories,
  template,
}: {
  categories: Category[];
  template: ExpenseTemplateWithCategory;
}) {
  const [state, formAction] = useActionState(updateExpenseTemplate, INITIAL);

  return (
    <div className="space-y-3 rounded-xl border p-3">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="id" value={template.id} />
        <TemplateFields
          categories={categories}
          idPrefix={`template-${template.id}`}
          template={template}
        />
        {state.error && (
          <p className="text-sm font-medium text-destructive">{state.error}</p>
        )}
        {state.ok && (
          <p className="text-sm font-medium text-primary">Template saved.</p>
        )}
        <SubmitButton label="Save template" />
      </form>
      <form action={deleteExpenseTemplate}>
        <input type="hidden" name="id" value={template.id} />
        <Button type="submit" variant="outline" size="sm">
          Delete template
        </Button>
      </form>
    </div>
  );
}

export function QuickExpenseBar({
  categories,
  templates,
}: {
  categories: Category[];
  templates: ExpenseTemplateWithCategory[];
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <section className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Quick add</h2>
          <p className="text-sm text-muted-foreground">
            Save common expenses and add them for today with one tap.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
        >
          {templates.length === 0 ? (
            <Plus className="size-4" />
          ) : (
            <Settings className="size-4" />
          )}
          Manage
        </Button>
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add a template like “Morning subway” to make repeat expenses faster.
        </p>
      ) : (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {templates.map((template) => (
            <QuickExpenseButton key={template.id} template={template} />
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Manage quick expenses"
      >
        <div className="space-y-4">
          <CreateTemplateForm categories={categories} />
          {templates.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Saved templates</h3>
              {templates.map((template) => (
                <TemplateEditForm
                  key={template.id}
                  categories={categories}
                  template={template}
                />
              ))}
            </div>
          )}
        </div>
      </Modal>
    </section>
  );
}
