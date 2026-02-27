import { apiFetch } from "./client";
import type {
  ApproveRequest,
  CuratorActionResponse,
  QueueItem,
  QueueListResponse,
  QueueStatus,
  RejectRequest,
} from "@/lib/types";

export async function fetchQueue(
  status?: QueueStatus,
  limit = 20,
  offset = 0
): Promise<QueueListResponse> {
  return apiFetch<QueueListResponse>("/api/v1/curator/queue", {
    params: { status, limit, offset },
  });
}

export async function fetchQueueItem(assetId: string): Promise<QueueItem> {
  return apiFetch<QueueItem>(
    `/api/v1/curator/queue/${encodeURIComponent(assetId)}`
  );
}

export async function approveItem(
  assetId: string,
  body: ApproveRequest
): Promise<CuratorActionResponse> {
  return apiFetch<CuratorActionResponse>(
    `/api/v1/curator/queue/${encodeURIComponent(assetId)}/approve`,
    { method: "POST", body: JSON.stringify(body) }
  );
}

export async function rejectItem(
  assetId: string,
  body: RejectRequest
): Promise<CuratorActionResponse> {
  return apiFetch<CuratorActionResponse>(
    `/api/v1/curator/queue/${encodeURIComponent(assetId)}/reject`,
    { method: "POST", body: JSON.stringify(body) }
  );
}
