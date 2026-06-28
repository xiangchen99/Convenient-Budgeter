import { TopBarActions } from "@/components/app-nav-actions";
export { BottomNav } from "@/components/bottom-nav";

export function TopBar({ name }: { name: string | null }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          $
        </div>
        <span className="text-sm font-semibold">
          {name ? `Hi, ${name}` : "Convenient Budgeter"}
        </span>
      </div>
      <TopBarActions />
    </header>
  );
}
