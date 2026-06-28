import { Card } from "@/components/ui/card";

export function AppRouteLoading() {
  return (
    <div className="space-y-5">
      <div className="h-7 w-36 animate-pulse rounded-md bg-muted" />
      <Card className="space-y-3 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-20 animate-pulse rounded-xl bg-muted" />
      </Card>
      <Card className="divide-y">
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex items-center gap-3 px-4 py-3">
            <div className="size-3 rounded-full bg-muted" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-4 w-14 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </Card>
    </div>
  );
}
