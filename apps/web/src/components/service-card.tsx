"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import type { ZohoService } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ServiceTile } from "@/components/service-tile";

export async function launchService(key: string) {
  const { url } = await api.post<{ url: string }>(`/api/zoho/services/${key}/launch`);
  window.open(url, "_blank", "noopener,noreferrer");
}

export function ServiceCard({ service }: { service: ZohoService }) {
  const [busy, setBusy] = useState(false);

  const open = async () => {
    setBusy(true);
    try {
      await launchService(service.key);
    } catch (err) {
      toast.error(errorMessage(err, "Unable to open service"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="group flex flex-col rounded-xl border bg-card p-5 transition-[border-color,transform,box-shadow] duration-150 hover:-translate-y-px hover:border-ring/40 hover:shadow-sm">
      <div className="flex items-start gap-3.5">
        <ServiceTile serviceKey={service.key} />
        <div className="min-w-0">
          <h3 className="font-display text-[17px] leading-tight font-semibold">{service.name}</h3>
          <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">{service.description}</p>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between gap-2">
        <Button onClick={open} disabled={busy} className="h-9">
          <ExternalLink data-icon="inline-start" />
          Open in Zoho
        </Button>
        <Link
          href={`/services/${service.key}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
        >
          View {service.resourceLabel.toLowerCase()}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}
