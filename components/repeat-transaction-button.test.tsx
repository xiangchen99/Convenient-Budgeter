import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepeatTransactionButton } from "@/components/repeat-transaction-button";

vi.mock("@/app/(app)/transactions/actions", () => ({
  repeatTransaction: vi.fn(),
}));

describe("RepeatTransactionButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 27, 20, 30, 0));
  });

  it("submits the phone's local date, not a UTC-derived date", () => {
    const { container } = render(<RepeatTransactionButton id="txn-1" />);
    const button = screen.getByRole("button", {
      name: /repeat expense today/i,
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
});
