import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createExpenseTemplate,
  createTransaction,
  createTransactionFromTemplate,
  repeatTransaction,
  updateTransaction,
} from "@/app/(app)/transactions/actions";

const { getDb, requireUser, revalidatePath, mockRun, mockFirst, mockBind, mockPrepare } =
  vi.hoisted(() => {
    const mockRun = vi.fn().mockResolvedValue({ success: true, results: [] });
    const mockFirst = vi.fn();
    const mockBind = vi.fn();
    const mockPrepare = vi.fn();

    return {
      getDb: vi.fn(),
      requireUser: vi.fn(),
      revalidatePath: vi.fn(),
      mockRun,
      mockFirst,
      mockBind,
      mockPrepare,
    };
  });

vi.mock("@/lib/db", () => ({
  getDb,
}));

vi.mock("@/lib/db/auth", () => ({
  requireUser,
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

function makeMockDb() {
  const stmt = {
    bind: mockBind.mockImplementation((...args: unknown[]) => stmt),
    run: mockRun,
    first: mockFirst,
  };
  mockPrepare.mockReturnValue(stmt);

  return {
    prepare: mockPrepare,
  };
}

describe("transaction server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const db = makeMockDb();
    getDb.mockResolvedValue(db);
    requireUser.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      created_at: "2026-01-01",
    });
    mockFirst.mockResolvedValue({
      amount: 6.58,
      category_id: "category-1",
      note: "Coffee",
      split_days: 2,
    });
  });

  it("creates a transaction with split_days", async () => {
    const formData = new FormData();
    formData.set("amount", "12.34");
    formData.set("occurred_on", "2026-06-27");
    formData.set("category_id", "category-1");
    formData.set("split_days", "3");
    formData.set("note", "Meal prep");

    await createTransaction({ error: null, ok: false }, formData);

    expect(mockPrepare).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO transactions")
    );
    expect(mockBind).toHaveBeenCalledWith(
      expect.any(String), // id
      "user-1",
      12.34,
      "2026-06-27",
      3,
      null,
      "category-1",
      "Meal prep"
    );
    expect(mockRun).toHaveBeenCalled();
  });

  it("creates a transaction carried to the next weekly budget", async () => {
    const formData = new FormData();
    formData.set("amount", "12.34");
    formData.set("occurred_on", "2026-06-27");
    formData.set("category_id", "category-1");
    formData.set("split_days", "1");
    formData.set("carry_to_next_week", "true");

    await createTransaction({ error: null, ok: false }, formData);

    expect(mockBind).toHaveBeenCalledWith(
      expect.any(String),
      "user-1",
      12.34,
      "2026-06-27",
      1,
      "2026-06-29",
      "category-1",
      null
    );
  });

  it("updates a transaction with a clamped split_days value", async () => {
    const formData = new FormData();
    formData.set("id", "txn-1");
    formData.set("amount", "12.34");
    formData.set("occurred_on", "2026-06-27");
    formData.set("category_id", "category-1");
    formData.set("split_days", "999");
    formData.set("note", "Meal prep");

    await updateTransaction({ error: null, ok: false }, formData);

    expect(mockPrepare).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE transactions")
    );
    expect(mockBind).toHaveBeenCalledWith(
      12.34,
      "2026-06-27",
      365,
      null,
      "category-1",
      "Meal prep",
      "txn-1",
      "user-1"
    );
  });

  it("repeats an expense using the phone-submitted local date", async () => {
    const formData = new FormData();
    formData.set("id", "txn-1");
    formData.set("occurred_on", "2026-06-27");

    await repeatTransaction(formData);

    expect(mockBind).toHaveBeenCalledWith(
      expect.any(String),
      "user-1",
      6.58,
      "category-1",
      "Coffee",
      2,
      null,
      "2026-06-27"
    );
    expect(revalidatePath).toHaveBeenCalledWith("/transactions");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("falls back to a valid local date if the submitted date is invalid", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 27, 20, 30, 0));

    const formData = new FormData();
    formData.set("id", "txn-1");
    formData.set("occurred_on", "not-a-date");

    await repeatTransaction(formData);

    expect(mockBind).toHaveBeenCalledWith(
      expect.any(String),
      "user-1",
      6.58,
      "category-1",
      "Coffee",
      2,
      null,
      "2026-06-27"
    );
  });

  it("does not insert when the original transaction is missing", async () => {
    mockFirst.mockResolvedValue(null);

    const formData = new FormData();
    formData.set("id", "txn-1");
    formData.set("occurred_on", "2026-06-27");

    await repeatTransaction(formData);

    expect(mockRun).not.toHaveBeenCalled();
  });

  it("creates a reusable expense template", async () => {
    const formData = new FormData();
    formData.set("name", "Morning subway");
    formData.set("amount", "2.90");
    formData.set("category_id", "transport");
    formData.set("split_days", "1");
    formData.set("note", "Weekday commute");

    await createExpenseTemplate({ error: null, ok: false }, formData);

    expect(mockPrepare).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO expense_templates")
    );
    expect(mockBind).toHaveBeenCalledWith(
      expect.any(String),
      "user-1",
      "Morning subway",
      2.9,
      "transport",
      1,
      "Weekday commute"
    );
  });

  it("creates today's transaction from a quick expense template", async () => {
    mockFirst.mockResolvedValueOnce({
      amount: 2.9,
      category_id: "transport",
      note: "Weekday commute",
      split_days: 1,
    });

    const formData = new FormData();
    formData.set("id", "template-1");
    formData.set("occurred_on", "2026-06-27");

    await createTransactionFromTemplate(formData);

    expect(mockBind).toHaveBeenCalledWith(
      expect.any(String),
      "user-1",
      2.9,
      "transport",
      "Weekday commute",
      1,
      null,
      "2026-06-27"
    );
  });
});
