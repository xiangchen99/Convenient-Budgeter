"use client";

import dynamic from "next/dynamic";

export type DailyPoint = { label: string; amount: number };

export type CategorySlice = {
  name: string;
  value: number;
  color: string;
};

const SpendOverTime = dynamic(
  () =>
    import("@/components/charts/spend-over-time").then(
      (mod) => mod.SpendOverTime
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton label="Loading spending chart..." />,
  }
);

const SpendByCategory = dynamic(
  () =>
    import("@/components/charts/spend-by-category").then(
      (mod) => mod.SpendByCategory
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton label="Loading category chart..." />,
  }
);

export function LazySpendOverTime({ data }: { data: DailyPoint[] }) {
  return <SpendOverTime data={data} />;
}

export function LazySpendByCategory({ data }: { data: CategorySlice[] }) {
  return <SpendByCategory data={data} />;
}

function ChartSkeleton({ label }: { label: string }) {
  return (
    <div className="flex h-[220px] animate-pulse items-center justify-center rounded-lg bg-muted/50 text-sm text-muted-foreground">
      {label}
    </div>
  );
}
