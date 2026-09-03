"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { can } from "@/lib/permissions";
import { serviceTheme } from "@/lib/service-theme";
import { fullName, initials } from "@/lib/format";
import { useAuth } from "@/components/auth-provider";
import { Brand } from "./brand";
import { adminNav, primaryNav, type NavItem } from "./nav-items";
import type { ZohoService } from "@/lib/types";

interface Props {
  services: ZohoService[];
  onNavigate?: () => void;
}

function NavLink({
  href,
  label,
  active,
  onClick,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:top-2 before:bottom-2 before:left-0 before:w-[3px] before:rounded-r before:bg-sidebar-primary"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      {children}
      <span className="truncate">{label}</span>
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-6 pb-2 text-[11px] font-medium tracking-[0.08em] text-sidebar-foreground/50 uppercase">
      {children}
    </p>
  );
}

function IconItem({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink href={item.href} label={item.label} active={active} onClick={onClick}>
      <Icon className="size-4 shrink-0 opacity-80" />
    </NavLink>
  );
}

export function Sidebar({ services, onNavigate }: Props) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const visible = (items: NavItem[]) => items.filter((i) => !i.permission || can(user, i.permission));
  const admin = visible(adminNav);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center px-5">
        <Link href="/dashboard" onClick={onNavigate} className="rounded-md">
          <Brand />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="space-y-0.5">
          {visible(primaryNav).map((item) => (
            <IconItem key={item.href} item={item} active={isActive(item.href)} onClick={onNavigate} />
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
                  active={isActive(`/services/${s.key}`)}
                  onClick={onNavigate}
                >
                  <span className="flex size-4 items-center justify-center">
                    <span className={cn("size-2 rounded-full", serviceTheme(s.key).dot)} />
                  </span>
                </NavLink>
              ))}
            </div>
          </>
        ) : null}

        {admin.length > 0 ? (
          <>
            <SectionLabel>Administration</SectionLabel>
            <div className="space-y-0.5">
              {admin.map((item) => (
                <IconItem key={item.href} item={item} active={isActive(item.href)} onClick={onNavigate} />
              ))}
            </div>
          </>
        ) : null}
      </nav>

      {user ? (
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-foreground/15 text-xs font-semibold text-white">
              {initials(user)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{fullName(user)}</p>
              <p className="truncate font-mono text-[11px] text-sidebar-foreground/60">{user.email}</p>
            </div>
          </div>
          <div className="mt-1 flex gap-1">
            <Link
              href="/settings"
              onClick={onNavigate}
              className={cn(
                "flex h-9 flex-1 items-center gap-2 rounded-md px-2 text-[13px] transition-colors",
                isActive("/settings")
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-white",
              )}
            >
              <Settings className="size-4" />
              Settings
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              aria-label="Sign out"
              title="Sign out"
              className="flex size-9 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-white"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
