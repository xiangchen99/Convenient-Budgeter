export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-muted/30 p-4">
      <div className="mb-6 flex items-center gap-2 text-primary">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
          $
        </div>
        <span className="text-lg font-semibold text-foreground">
          Convenient Budgeter
        </span>
      </div>
      {children}
    </main>
  );
}
