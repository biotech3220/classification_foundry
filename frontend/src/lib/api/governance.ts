import { apiFetch } from "./client";
import type {
  FreshnessResponse,
  GovernanceAlert,
  SLAResponse,
} from "@/lib/types";

export async function fetchAlerts(
  severity?: string,
  acknowledged?: boolean,
  limit = 50
): Promise<GovernanceAlert[]> {
  return apiFetch<GovernanceAlert[]>("/api/v1/governance/alerts", {
    params: {
      severity,
      acknowledged: acknowledged !== undefined ? acknowledged : undefined,
      limit,
    },
  });
}

export async function acknowledgeAlert(
  alertId: string,
  acknowledgedBy: string
): Promise<{ success: boolean; alert_id: string }> {
  return apiFetch(`/api/v1/governance/alerts/${encodeURIComponent(alertId)}/acknowledge`, {
    method: "POST",
    params: { acknowledged_by: acknowledgedBy },
  });
}

export async function fetchFreshness(): Promise<FreshnessResponse> {
  return apiFetch<FreshnessResponse>("/api/v1/governance/freshness");
}

export async function fetchSLA(): Promise<SLAResponse> {
  return apiFetch<SLAResponse>("/api/v1/governance/sla");
}
