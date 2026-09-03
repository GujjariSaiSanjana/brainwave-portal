"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { can } from "@/lib/permissions";
import { Button } from "@/components/ui/button";

interface Props {
  permission: string;
  children: React.ReactNode;
}

export function RequirePermission({ permission, children }: Props) {
  const { user } = useAuth();
  if (!user) return null;

  if (!can(user, permission)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <ShieldAlert className="size-8 text-muted-foreground" />
        <h2 className="text-lg font-medium">Access denied</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your account does not have permission to view this page. Contact an administrator if you
          believe this is a mistake.
        </p>
        <Button variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
