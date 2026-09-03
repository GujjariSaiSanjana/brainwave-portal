"use client";

import Link from "next/link";
import { LogOut, Menu, Settings } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fullName, initials } from "@/lib/format";

interface Props {
  onOpenMenu: () => void;
}

export function Header({ onOpenMenu }: Props) {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-background px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenMenu}
        aria-label="Open navigation"
      >
        <Menu />
      </Button>

      <div className="hidden items-center gap-1.5 sm:flex">
        {user.roles.map((r) => (
          <Badge key={r.id} variant="secondary">
            {r.name}
          </Badge>
        ))}
        {user.department ? <Badge variant="outline">{user.department.name}</Badge> : null}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">{fullName(user)}</span>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu" />
            }
          >
            <Avatar size="sm">
              <AvatarFallback>{initials(user)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{fullName(user)}</span>
                <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/settings" />}>
              <Settings />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => void logout()}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
