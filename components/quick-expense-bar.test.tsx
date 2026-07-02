import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuickExpenseBar } from "@/components/quick-expense-bar";
import type {
  Category,
  ExpenseTemplateWithCategory,
} from "@/lib/types";

vi.mock("@/app/(app)/transactions/actions", () => ({
  createExpenseTemplate: vi.fn(async () => ({ error: null, ok: false })),
  updateExpenseTemplate: vi.fn(async () => ({ error: null, ok: false })),
  deleteExpenseTemplate: vi.fn(),
  createTransactionFromTemplate: vi.fn(),
}));

const categories: Category[] = [
  {
    id: "transport",
    user_id: "user-1",
    name: "Transport",
    color: "#2563eb",
    created_at: "2026-06-01T00:00:00Z",
  },
];

const template: ExpenseTemplateWithCategory = {
  id: "template-1",
  user_id: "user-1",
  name: "Morning subway",
  category_id: "transport",
  amount: 2.9,
  split_days: 1,
  note: "Weekday commute",
  sort_order: 0,
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
  category: {
    id: "transport",
    name: "Transport",
    color: "#2563eb",
  },
};

describe("QuickExpenseBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 27, 20, 30, 0));
  });

  it("submits the phone's local date when adding a template", () => {
    const { container } = render(
      <QuickExpenseBar categories={categories} templates={[template]} />
    );
    const button = screen.getByRole("button", {
      name: /add morning subway today/i,
    });
    const form = button.closest("form");
    const localDateInput = container.querySelector<HTMLInputElement>(
      'input[name="occurred_on"]'
    );

    expect(localDateInput).toHaveValue("2026-06-27");

    vi.setSystemTime(new Date(2026, 5, 28, 0, 5, 0));
    fireEvent.submit(form!);

    expect(localDateInput).toHaveValue("2026-06-28");
  });

  it("opens template management when no templates exist", () => {
    render(<QuickExpenseBar categories={categories} templates={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /manage/i }));

    expect(screen.getByRole("dialog", { name: /manage quick expenses/i }))
      .toBeInTheDocument();
    expect(screen.getByPlaceholderText("Morning subway")).toBeInTheDocument();
  });
});
