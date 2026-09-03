"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { can } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

interface Props {
  permission: string;
  children: React.ReactNode;
}

export function RequirePermission({ permission, children }: Props) {
  const { user } = useAuth();
  if (!user) return null;

  if (!can(user, permission)) {
    return (
      <div className="py-12">
        <EmptyState
          icon={ShieldAlert}
          title="Access denied"
          description="Your account does not have permission to view this page. Contact an administrator if you believe this is a mistake."
          action={
            <Button variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>
              Back to dashboard
            </Button>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}
