import { beforeEach, describe, expect, it, vi } from "vitest";
import { repeatTransaction } from "@/app/(app)/transactions/actions";

const { createClient, revalidatePath, insert, maybeSingle } = vi.hoisted(() => ({
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
  insert: vi.fn(),
  maybeSingle: vi.fn(),
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
    insert.mockResolvedValue({ error: null });
    maybeSingle.mockResolvedValue({
      data: {
        amount: "6.58",
        category_id: "category-1",
        note: "Coffee",
      },
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
});
