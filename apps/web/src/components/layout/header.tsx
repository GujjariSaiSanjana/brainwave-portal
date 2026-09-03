"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "./brand";

interface Props {
  onOpenMenu: () => void;
}

// Only shown on small screens; on desktop the sidebar carries the brand and account.
export function MobileBar({ onOpenMenu }: Props) {
  return (
    <header className="flex h-14 items-center gap-2 border-b bg-card px-3 md:hidden">
      <Button variant="ghost" size="icon" onClick={onOpenMenu} aria-label="Open navigation" className="size-10">
        <Menu />
      </Button>
      <Brand dark={false} />
    </header>
  );
}
