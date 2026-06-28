import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionDialog } from "@/components/transaction-dialog";
import type { Category } from "@/lib/types";

vi.mock("@/app/(app)/transactions/actions", () => ({
  createTransaction: vi.fn(async () => ({ error: null, ok: false })),
  updateTransaction: vi.fn(async () => ({ error: null, ok: false })),
}));

const categories: Category[] = [
  {
    id: "food",
    user_id: "user-1",
    name: "Food & Dining",
    color: "#16a34a",
    created_at: "2026-06-01T00:00:00Z",
  },
  {
    id: "transport",
    user_id: "user-1",
    name: "Transport",
    color: "#2563eb",
    created_at: "2026-06-01T00:00:00Z",
  },
];

describe("TransactionDialog", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 27, 20, 30, 0));
  });

  it("defaults new expenses to the phone's local calendar day", async () => {
    render(<TransactionDialog categories={categories} />);

    fireEvent.click(screen.getByRole("button", { name: /add expense/i }));

    expect(screen.getByLabelText("Date")).toHaveValue("2026-06-27");
  });

  it("prefills the last-used category on quick add", async () => {
    window.localStorage.setItem(
      "convenient-budgeter:last-category-id",
      "transport"
    );

    render(<TransactionDialog categories={categories} />);
    fireEvent.click(screen.getByRole("button", { name: /add expense/i }));

    expect(screen.getByLabelText("Category")).toHaveValue("transport");
  });

  it("uses an existing transaction date and category when editing", () => {
    render(
      <TransactionDialog
        categories={categories}
        trigger="none"
        open
        transaction={{
          id: "txn-1",
          user_id: "user-1",
          category_id: "food",
          amount: 12.5,
          occurred_on: "2026-06-15",
          note: "Lunch",
          created_at: "2026-06-15T12:00:00Z",
          category: {
            id: "food",
            name: "Food & Dining",
            color: "#16a34a",
          },
        }}
      />
    );

    expect(screen.getByLabelText("Date")).toHaveValue("2026-06-15");
    expect(screen.getByLabelText("Category")).toHaveValue("food");
    expect(screen.getByLabelText("Amount")).toHaveValue(12.5);
  });
});
