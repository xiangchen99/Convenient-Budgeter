"use client";

import * as React from "react";
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
  return (
    <LoadWhenVisible fallback={<ChartSkeleton label="Loading spending chart..." />}>
      <SpendOverTime data={data} />
    </LoadWhenVisible>
  );
}

export function LazySpendByCategory({ data }: { data: CategorySlice[] }) {
  return (
    <LoadWhenVisible fallback={<ChartSkeleton label="Loading category chart..." />}>
      <SpendByCategory data={data} />
    </LoadWhenVisible>
  );
}

function LoadWhenVisible({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isVisible) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible]);

  return <div ref={ref}>{isVisible ? children : fallback}</div>;
}

function ChartSkeleton({ label }: { label: string }) {
  return (
    <div className="flex h-[220px] animate-pulse items-center justify-center rounded-lg bg-muted/50 text-sm text-muted-foreground">
      {label}
    </div>
  );
}
