"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { can } from "@/lib/permissions";
import { useAuth } from "@/components/auth-provider";
import { adminNav, primaryNav, settingsNav, type NavItem } from "./nav-items";
import type { ZohoService } from "@/lib/types";

interface Props {
  services: ZohoService[];
  onNavigate?: () => void;
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: NavItem["icon"];
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
        active
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2.5 pt-4 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </p>
  );
}

export function Sidebar({ services, onNavigate }: Props) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const visible = (items: NavItem[]) => items.filter((i) => !i.permission || can(user, i.permission));
  const admin = visible(adminNav);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Layers className="size-4" />
        </div>
        <span className="font-semibold">Brainwave</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-0.5">
          {visible(primaryNav).map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} onClick={onNavigate} />
          ))}
        </div>

        {services.length > 0 ? (
          <>
            <SectionLabel>Zoho services</SectionLabel>
            <div className="space-y-0.5">
              {services.map((s) => (
                <NavLink
                  key={s.key}
                  href={`/services/${s.key}`}
                  label={s.name}
                  icon={ExternalLink}
                  active={isActive(`/services/${s.key}`)}
                  onClick={onNavigate}
                />
              ))}
            </div>
          </>
        ) : null}

        {admin.length > 0 ? (
          <>
            <SectionLabel>Administration</SectionLabel>
            <div className="space-y-0.5">
              {admin.map((item) => (
                <NavLink key={item.href} {...item} active={isActive(item.href)} onClick={onNavigate} />
              ))}
            </div>
          </>
        ) : null}
      </nav>

      <div className="border-t px-2 py-2">
        <NavLink {...settingsNav} active={isActive(settingsNav.href)} onClick={onNavigate} />
      </div>
    </div>
  );
}
