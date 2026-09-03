"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import type { Profile } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const DEMO_PASSWORD = "Password123!";
const DEMO_ACCOUNTS = [
  { email: "admin@brainwave.dev", role: "Admin" },
  { email: "manager@brainwave.dev", role: "Manager · Sales" },
  { email: "hr@brainwave.dev", role: "HR" },
  { email: "sales@brainwave.dev", role: "Sales" },
  { email: "support@brainwave.dev", role: "Support" },
  { email: "finance@brainwave.dev", role: "Finance" },
  { email: "employee@brainwave.dev", role: "Employee" },
];

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { user } = await api.post<{ user: Profile }>("/api/auth/login", { email, password });
      setUser(user);
      router.replace(safeNext(params.get("next")));
    } catch (err) {
      setError(errorMessage(err, "Unable to sign in"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-[400px]">
      <div className="rounded-xl border bg-card p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <h2 className="font-display text-[28px] leading-none font-semibold">Sign in</h2>
        <p className="mt-2 text-sm text-muted-foreground">Use your portal credentials to continue.</p>

        <form onSubmit={submit} className="mt-7 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              className="h-11 px-3.5 text-[15px] md:text-[15px]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-11 px-3.5 text-[15px] md:text-[15px]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/6 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="h-11 w-full text-[15px]" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>

      <div className="mt-4 rounded-xl border bg-card/60">
        <button
          type="button"
          onClick={() => setShowDemo((v) => !v)}
          aria-expanded={showDemo}
          className="flex h-11 w-full items-center justify-between rounded-xl px-4 text-sm font-medium"
        >
          Demo accounts
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showDemo && "rotate-180")} />
        </button>
        {showDemo ? (
          <div className="border-t px-2 pt-2 pb-3">
            <ul>
              {DEMO_ACCOUNTS.map((a) => (
                <li key={a.email}>
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-between gap-3 rounded-md px-2 text-left transition-colors hover:bg-muted"
                    onClick={() => {
                      setEmail(a.email);
                      setPassword(DEMO_PASSWORD);
                    }}
                  >
                    <span className="font-mono text-[13px]">{a.email}</span>
                    <span className="text-xs text-muted-foreground">{a.role}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 px-2 text-xs text-muted-foreground">
              Password for every account is <span className="font-mono">{DEMO_PASSWORD}</span>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
