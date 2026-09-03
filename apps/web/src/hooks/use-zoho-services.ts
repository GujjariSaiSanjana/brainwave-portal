"use client";

import { useCallback } from "react";
import { api } from "@/lib/api";
import type { ZohoServicesResponse } from "@/lib/types";
import { useRequest } from "./use-request";

export function useZohoServices() {
  const fetcher = useCallback(() => api.get<ZohoServicesResponse>("/api/zoho/services"), []);
  return useRequest(fetcher);
}
