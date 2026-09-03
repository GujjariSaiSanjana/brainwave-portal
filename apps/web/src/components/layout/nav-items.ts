import { Activity, Building2, KeyRound, LayoutDashboard, Plug, Users, type LucideIcon } from "lucide-react";
import { PERMISSIONS } from "@/lib/permissions";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: string;
}

export const primaryNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/team", label: "Team", icon: Building2, permission: PERMISSIONS.teamRead },
];

export const adminNav: NavItem[] = [
  { href: "/admin/users", label: "Users", icon: Users, permission: PERMISSIONS.usersRead },
  { href: "/admin/roles", label: "Roles", icon: KeyRound, permission: PERMISSIONS.rolesRead },
  { href: "/admin/audit", label: "Audit log", icon: Activity, permission: PERMISSIONS.auditRead },
  {
    href: "/admin/integrations",
    label: "Integrations",
    icon: Plug,
    permission: PERMISSIONS.integrationsManage,
  },
];
