import { describe, expect, it } from "vitest";
import {
  formatLocalDate,
  formatLocalMonth,
  parseLocalDate,
  parseLocalMonth,
} from "@/lib/dates";

describe("local date helpers", () => {
  it("formats calendar dates from local date parts instead of UTC strings", () => {
    const lateLocalDay = new Date(2026, 5, 27, 20, 30, 0);

    expect(formatLocalDate(lateLocalDay)).toBe("2026-06-27");
    expect(formatLocalMonth(lateLocalDay)).toBe("2026-06");
  });

  it("parses YYYY-MM-DD into a local Date", () => {
    const parsed = parseLocalDate("2026-06-27");

    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(5);
    expect(parsed?.getDate()).toBe(27);
  });

  it("parses YYYY-MM into the first day of the local month", () => {
    const parsed = parseLocalMonth("2026-07");

    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(6);
    expect(parsed?.getDate()).toBe(1);
  });

  it("returns null for invalid date strings", () => {
    expect(parseLocalDate("2026-6-27")).toBeNull();
    expect(parseLocalDate("not-a-date")).toBeNull();
    expect(parseLocalMonth("2026-6")).toBeNull();
    expect(parseLocalMonth(null)).toBeNull();
  });
});
