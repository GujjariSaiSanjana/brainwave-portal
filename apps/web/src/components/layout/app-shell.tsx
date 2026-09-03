"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useZohoServices } from "@/hooks/use-zoho-services";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileBar } from "./header";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: services } = useZohoServices();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden w-[264px] bg-sidebar md:block" />
        <div className="flex-1 px-12 py-10">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-8 w-64" />
          <Skeleton className="mt-8 h-40 w-full" />
        </div>
      </div>
    );
  }

  const serviceItems = services?.items ?? [];

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-[264px] shrink-0 md:block">
        <div className="sticky top-0 h-screen">
          <Sidebar services={serviceItems} />
        </div>
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[280px] border-sidebar-border bg-sidebar p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar services={serviceItems} onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileBar onOpenMenu={() => setMenuOpen(true)} />
        <main className="flex-1 px-6 py-6 md:px-12 md:py-10">
          <div className="mx-auto w-full max-w-[1180px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
