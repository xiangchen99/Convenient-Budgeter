"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

export function TopBarActions() {
  const router = useRouter();
  const [isRefreshing, startTransition] = React.useTransition();

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={refresh}
        disabled={isRefreshing}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-60"
        aria-label="Refresh data"
        title="Refresh"
      >
        <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
        <span className="hidden sm:inline">
          {isRefreshing ? "Refreshing" : "Refresh"}
        </span>
      </button>
      <form action={signOut}>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </form>
    </div>
  );
}
