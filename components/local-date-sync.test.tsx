import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocalDateSync } from "@/components/local-date-sync";
import {
  formatLocalDate,
  formatLocalMonth,
  LOCAL_DATE_COOKIE,
  LOCAL_MONTH_COOKIE,
  LOCAL_TIME_ZONE_COOKIE,
} from "@/lib/dates";

const { refresh } = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

function readCookie(name: string) {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")[1];
}

describe("LocalDateSync", () => {
  it("writes local date, month, and timezone cookies and refreshes once", async () => {
    render(<LocalDateSync />);

    await waitFor(() => {
      expect(readCookie(LOCAL_DATE_COOKIE)).toBe(formatLocalDate());
      expect(readCookie(LOCAL_MONTH_COOKIE)).toBe(formatLocalMonth());
      expect(readCookie(LOCAL_TIME_ZONE_COOKIE)).toBeTruthy();
      expect(refresh).toHaveBeenCalledTimes(1);
    });
  });

  it("refreshes when stored local date cookies are stale", async () => {
    document.cookie = `${LOCAL_DATE_COOKIE}=2000-01-01; path=/`;
    document.cookie = `${LOCAL_MONTH_COOKIE}=2000-01; path=/`;

    render(<LocalDateSync />);

    await waitFor(() => {
      expect(readCookie(LOCAL_DATE_COOKIE)).toBe(formatLocalDate());
      expect(readCookie(LOCAL_MONTH_COOKIE)).toBe(formatLocalMonth());
      expect(refresh).toHaveBeenCalledTimes(1);
    });
  });
});
