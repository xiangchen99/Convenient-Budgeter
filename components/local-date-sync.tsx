"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  formatLocalDate,
  formatLocalMonth,
  LOCAL_DATE_COOKIE,
  LOCAL_MONTH_COOKIE,
  LOCAL_TIME_ZONE_COOKIE,
} from "@/lib/dates";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getCookie(name: string) {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")[1];
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

export function LocalDateSync() {
  const router = useRouter();

  React.useEffect(() => {
    const sync = () => {
      const localDate = formatLocalDate();
      const localMonth = formatLocalMonth();
      const timeZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "local";

      const changed =
        getCookie(LOCAL_DATE_COOKIE) !== localDate ||
        getCookie(LOCAL_MONTH_COOKIE) !== localMonth ||
        decodeURIComponent(getCookie(LOCAL_TIME_ZONE_COOKIE) ?? "") !== timeZone;

      if (!changed) return;

      setCookie(LOCAL_DATE_COOKIE, localDate);
      setCookie(LOCAL_MONTH_COOKIE, localMonth);
      setCookie(LOCAL_TIME_ZONE_COOKIE, timeZone);
      router.refresh();
    };

    sync();
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
  }, [router]);

  return null;
}
