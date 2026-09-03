"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Layers } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import type { Profile } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMO_ACCOUNTS = [
  { email: "admin@brainwave.dev", role: "Admin" },
  { email: "manager@brainwave.dev", role: "Manager (Sales)" },
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
    <div className="w-full max-w-sm space-y-4">
      <div className="flex items-center justify-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Layers className="size-4" />
        </div>
        <span className="text-lg font-semibold">Brainwave</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your portal credentials to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-sm">Demo accounts</CardTitle>
          <CardDescription>
            Password for every account is <code className="font-mono">Password123!</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email} className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="font-mono text-xs text-foreground hover:underline"
                  onClick={() => {
                    setEmail(a.email);
                    setPassword("Password123!");
                  }}
                >
                  {a.email}
                </button>
                <span className="text-xs text-muted-foreground">{a.role}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
