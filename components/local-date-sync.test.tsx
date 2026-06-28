import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

describe("LocalDateSync", () => {
  beforeEach(() => {
    refresh.mockClear();
    clearCookie(LOCAL_DATE_COOKIE);
    clearCookie(LOCAL_MONTH_COOKIE);
    clearCookie(LOCAL_TIME_ZONE_COOKIE);
  });

  it("writes local date, month, and timezone cookies without refreshing on first sync", async () => {
    render(<LocalDateSync />);

    await waitFor(() => {
      expect(readCookie(LOCAL_DATE_COOKIE)).toBe(formatLocalDate());
      expect(readCookie(LOCAL_MONTH_COOKIE)).toBe(formatLocalMonth());
      expect(readCookie(LOCAL_TIME_ZONE_COOKIE)).toBeTruthy();
      expect(refresh).not.toHaveBeenCalled();
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
