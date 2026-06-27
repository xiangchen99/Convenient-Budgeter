"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function MonthNav({
  month,
  label,
  isCurrent,
}: {
  month: string; // YYYY-MM
  label: string;
  isCurrent: boolean;
}) {
  const router = useRouter();

  const shift = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    router.push(`/dashboard?month=${next}`);
  };

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => shift(-1)}
        aria-label="Previous month"
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ChevronLeft className="size-5" />
      </button>
      <span className="text-sm font-semibold">{label}</span>
      <button
        onClick={() => shift(1)}
        aria-label="Next month"
        disabled={isCurrent}
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
