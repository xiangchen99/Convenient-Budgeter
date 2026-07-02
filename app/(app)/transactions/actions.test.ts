import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createExpenseTemplate,
  createTransaction,
  createTransactionFromTemplate,
  repeatTransaction,
  updateTransaction,
} from "@/app/(app)/transactions/actions";

const { createClient, revalidatePath, insert, maybeSingle, update } = vi.hoisted(() => ({
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
  insert: vi.fn(),
  maybeSingle: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient,
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

function makeSupabase() {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle,
    insert,
    update,
  };

  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: {
          user: { id: "user-1" },
        },
      })),
    },
    from: vi.fn(() => chain),
    chain,
  };
}

describe("transaction server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insert.mockResolvedValue({ error: null });
    update.mockReturnValue({
      eq: vi.fn(() => ({
        eq: vi.fn(async () => ({ error: null })),
      })),
    });
    maybeSingle.mockResolvedValue({
      data: {
        amount: "6.58",
        category_id: "category-1",
        note: "Coffee",
        split_days: 2,
      },
    });
  });

  it("creates a transaction with split_days", async () => {
    const supabase = makeSupabase();
    createClient.mockResolvedValue(supabase);

    const formData = new FormData();
    formData.set("amount", "12.34");
    formData.set("occurred_on", "2026-06-27");
    formData.set("category_id", "category-1");
    formData.set("split_days", "3");
    formData.set("note", "Meal prep");

    await createTransaction({ error: null, ok: false }, formData);

    expect(insert).toHaveBeenCalledWith({
      user_id: "user-1",
      amount: 12.34,
      occurred_on: "2026-06-27",
      split_days: 3,
      weekly_budget_start: null,
      category_id: "category-1",
      note: "Meal prep",
    });
  });

  it("creates a transaction carried to the next weekly budget", async () => {
    const supabase = makeSupabase();
    createClient.mockResolvedValue(supabase);

    const formData = new FormData();
    formData.set("amount", "12.34");
    formData.set("occurred_on", "2026-06-27");
    formData.set("category_id", "category-1");
    formData.set("split_days", "1");
    formData.set("carry_to_next_week", "true");

    await createTransaction({ error: null, ok: false }, formData);

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        weekly_budget_start: "2026-06-29",
      })
    );
  });

  it("updates a transaction with a clamped split_days value", async () => {
    const supabase = makeSupabase();
    createClient.mockResolvedValue(supabase);

    const formData = new FormData();
    formData.set("id", "txn-1");
    formData.set("amount", "12.34");
    formData.set("occurred_on", "2026-06-27");
    formData.set("category_id", "category-1");
    formData.set("split_days", "999");
    formData.set("note", "Meal prep");

    await updateTransaction({ error: null, ok: false }, formData);

    expect(update).toHaveBeenCalledWith({
      amount: 12.34,
      occurred_on: "2026-06-27",
      split_days: 365,
      weekly_budget_start: null,
      category_id: "category-1",
      note: "Meal prep",
    });
  });

  it("repeats an expense using the phone-submitted local date", async () => {
    const supabase = makeSupabase();
    createClient.mockResolvedValue(supabase);

    const formData = new FormData();
    formData.set("id", "txn-1");
    formData.set("occurred_on", "2026-06-27");

    await repeatTransaction(formData);

    expect(insert).toHaveBeenCalledWith({
      user_id: "user-1",
      amount: 6.58,
      category_id: "category-1",
      note: "Coffee",
      split_days: 2,
      weekly_budget_start: null,
      occurred_on: "2026-06-27",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/transactions");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("falls back to a valid local date if the submitted date is invalid", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 27, 20, 30, 0));
    const supabase = makeSupabase();
    createClient.mockResolvedValue(supabase);

    const formData = new FormData();
    formData.set("id", "txn-1");
    formData.set("occurred_on", "not-a-date");

    await repeatTransaction(formData);

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        occurred_on: "2026-06-27",
      })
    );
  });

  it("does not insert when the original transaction is missing", async () => {
    maybeSingle.mockResolvedValue({ data: null });
    const supabase = makeSupabase();
    createClient.mockResolvedValue(supabase);

    const formData = new FormData();
    formData.set("id", "txn-1");
    formData.set("occurred_on", "2026-06-27");

    await repeatTransaction(formData);

    expect(insert).not.toHaveBeenCalled();
  });

  it("creates a reusable expense template", async () => {
    const supabase = makeSupabase();
    createClient.mockResolvedValue(supabase);

    const formData = new FormData();
    formData.set("name", "Morning subway");
    formData.set("amount", "2.90");
    formData.set("category_id", "transport");
    formData.set("split_days", "1");
    formData.set("note", "Weekday commute");

    await createExpenseTemplate({ error: null, ok: false }, formData);

    expect(insert).toHaveBeenCalledWith({
      user_id: "user-1",
      name: "Morning subway",
      amount: 2.9,
      category_id: "transport",
      split_days: 1,
      note: "Weekday commute",
    });
  });

  it("creates today's transaction from a quick expense template", async () => {
    maybeSingle.mockResolvedValueOnce({
      data: {
        amount: "2.90",
        category_id: "transport",
        note: "Weekday commute",
        split_days: 1,
      },
    });
    const supabase = makeSupabase();
    createClient.mockResolvedValue(supabase);

    const formData = new FormData();
    formData.set("id", "template-1");
    formData.set("occurred_on", "2026-06-27");

    await createTransactionFromTemplate(formData);

    expect(insert).toHaveBeenCalledWith({
      user_id: "user-1",
      amount: 2.9,
      category_id: "transport",
      note: "Weekday commute",
      split_days: 1,
      weekly_budget_start: null,
      occurred_on: "2026-06-27",
    });
  });
});
