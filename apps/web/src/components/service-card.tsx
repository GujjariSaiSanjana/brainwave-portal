"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Table2 } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import type { ZohoService } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{service.name}</CardTitle>
        <CardDescription>{service.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex flex-wrap gap-2">
        <Button onClick={open} disabled={busy}>
          <ExternalLink data-icon="inline-start" />
          Open in Zoho
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href={`/services/${service.key}`} />}>
          <Table2 data-icon="inline-start" />
          View {service.resourceLabel.toLowerCase()}
        </Button>
      </CardContent>
    </Card>
  );
}
