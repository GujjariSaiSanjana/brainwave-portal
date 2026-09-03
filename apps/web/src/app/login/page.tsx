import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { Brand } from "@/components/layout/brand";
import { serviceTheme } from "@/lib/service-theme";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign in" };

const SERVICES = [
  { key: "crm", label: "CRM" },
  { key: "people", label: "People" },
  { key: "desk", label: "Desk" },
  { key: "books", label: "Books" },
];

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[45fr_55fr]">
      <section className="flex flex-col bg-sidebar px-8 py-8 text-sidebar-foreground lg:px-14 lg:py-12">
        <Brand />
        <div className="my-10 max-w-md lg:my-auto">
          <h1 className="font-display text-[30px] leading-[1.15] font-semibold text-white lg:text-[38px]">
            One sign-in for every Zoho service your role allows.
          </h1>
          <p className="mt-5 hidden text-[15px] leading-relaxed text-sidebar-foreground/70 lg:block">
            Employees use portal credentials only. Access to CRM, People, Desk and Books is decided by the
            roles an administrator assigns.
          </p>
          <p className="mt-2 hidden text-[15px] leading-relaxed text-sidebar-foreground/70 lg:block">
            Zoho tokens stay on the server, encrypted, behind one service account.
          </p>
        </div>
        <ul className="hidden flex-wrap gap-x-6 gap-y-2 lg:flex">
          {SERVICES.map((s) => (
            <li key={s.key} className="flex items-center gap-2 text-[13px] text-sidebar-foreground/70">
              <span className={cn("size-2 rounded-full", serviceTheme(s.key).dot)} />
              {s.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex items-center justify-center bg-background px-6 py-10 lg:px-12">
        <Suspense>
          <LoginForm />
        </Suspense>
      </section>
    </div>
  );
}
