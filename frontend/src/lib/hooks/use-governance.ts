"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acknowledgeAlert,
  fetchAlerts,
  fetchFreshness,
  fetchSLA,
} from "@/lib/api/governance";

export function useAlerts(severity?: string, acknowledged?: boolean) {
  return useQuery({
    queryKey: ["alerts", severity, acknowledged],
    queryFn: () => fetchAlerts(severity, acknowledged),
    refetchInterval: 30_000,
  });
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      alertId,
      acknowledgedBy,
    }: {
      alertId: string;
      acknowledgedBy: string;
    }) => acknowledgeAlert(alertId, acknowledgedBy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useFreshness() {
  return useQuery({
    queryKey: ["freshness"],
    queryFn: fetchFreshness,
    refetchInterval: 60_000,
  });
}

export function useSLA() {
  return useQuery({
    queryKey: ["sla"],
    queryFn: fetchSLA,
    refetchInterval: 60_000,
  });
}
