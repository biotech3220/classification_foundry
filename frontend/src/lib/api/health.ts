import { apiFetch } from "./client";
import type {
  ClassificationQuality,
  HealthResponse,
  QueueStatsResponse,
} from "@/lib/types";

export async function fetchHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/api/v1/health");
}

export async function fetchQueueStats(): Promise<QueueStatsResponse> {
  return apiFetch<QueueStatsResponse>("/api/v1/health/queue-stats");
}

export async function fetchClassificationQuality(): Promise<ClassificationQuality> {
  return apiFetch<ClassificationQuality>(
    "/api/v1/health/classification-quality"
  );
}
