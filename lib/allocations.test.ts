import { describe, expect, it } from "vitest";
import {
  getTransactionAllocations,
  getTransactionAllocationsInRange,
  sumAllocations,
} from "@/lib/allocations";
import type { TransactionWithCategory } from "@/lib/types";

function transaction(
  amount: number,
  splitDays: number,
  occurredOn = "2026-06-27"
): TransactionWithCategory {
  return {
    id: "txn-1",
    user_id: "user-1",
    category_id: "food",
    amount,
    occurred_on: occurredOn,
    split_days: splitDays,
    note: "Groceries",
    created_at: "2026-06-27T12:00:00Z",
    category: {
      id: "food",
      name: "Food & Dining",
      color: "#16a34a",
    },
  };
}

describe("transaction allocations", () => {
  it("keeps one-day transactions on their original date", () => {
    const allocations = getTransactionAllocations(transaction(8, 1));

    expect(allocations).toEqual([
      expect.objectContaining({
        date: "2026-06-27",
        amount: 8,
      }),
    ]);
  });

  it("splits purchases forward from purchase date", () => {
    const allocations = getTransactionAllocations(transaction(10, 2));

    expect(allocations.map((allocation) => allocation.date)).toEqual([
      "2026-06-27",
      "2026-06-28",
    ]);
    expect(allocations.map((allocation) => allocation.amount)).toEqual([5, 5]);
  });

  it("distributes remainder cents to the earliest days", () => {
    const allocations = getTransactionAllocations(transaction(10, 3));

    expect(allocations.map((allocation) => allocation.amount)).toEqual([
      3.34,
      3.33,
      3.33,
    ]);
    expect(sumAllocations(allocations)).toBe(10);
  });

  it("filters allocations by inclusive date range", () => {
    const allocations = getTransactionAllocationsInRange(
      [transaction(12, 4, "2026-06-29")],
      "2026-07-01",
      "2026-07-02"
    );

    expect(allocations.map((allocation) => allocation.date)).toEqual([
      "2026-07-01",
      "2026-07-02",
    ]);
    expect(sumAllocations(allocations)).toBe(6);
  });
});
