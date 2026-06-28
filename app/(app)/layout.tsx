import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav, TopBar } from "@/components/app-nav";
import { LocalDateSync } from "@/components/local-date-sync";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-dvh flex-col bg-muted/20">
      <LocalDateSync />
      <TopBar name={profile?.display_name ?? null} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-5">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
