import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TransactionRow } from "@/components/transaction-row";
import type { TransactionWithCategory } from "@/lib/types";

vi.mock("@/app/(app)/transactions/actions", () => ({
  deleteTransaction: vi.fn(),
  repeatTransaction: vi.fn(),
}));

const transaction: TransactionWithCategory = {
  id: "txn-1",
  user_id: "user-1",
  category_id: "food",
  amount: 12.5,
  occurred_on: "2026-06-27",
  split_days: 2,
  note: "Leftovers",
  created_at: "2026-06-27T12:00:00Z",
  category: {
    id: "food",
    name: "Food & Dining",
    color: "#16a34a",
  },
};

describe("TransactionRow", () => {
  it("opens the edit flow when the edit button is tapped", () => {
    const listener = vi.fn();
    window.addEventListener("convenient-budgeter:edit-transaction", listener);

    render(<TransactionRow transaction={transaction} />);
    fireEvent.click(screen.getByRole("button", { name: /edit expense/i }));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toEqual(transaction);
    window.removeEventListener("convenient-budgeter:edit-transaction", listener);
  });

  it("does not open edit when a nested action button is tapped", () => {
    const listener = vi.fn();
    window.addEventListener("convenient-budgeter:edit-transaction", listener);

    render(<TransactionRow transaction={transaction} />);
    fireEvent.click(screen.getByRole("button", { name: /repeat expense today/i }));

    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener("convenient-budgeter:edit-transaction", listener);
  });
});
