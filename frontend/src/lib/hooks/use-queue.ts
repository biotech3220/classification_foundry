"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveItem,
  fetchQueue,
  fetchQueueItem,
  rejectItem,
} from "@/lib/api/curator";
import type {
  ApproveRequest,
  QueueListResponse,
  QueueStatus,
  RejectRequest,
} from "@/lib/types";

export function useQueue(status?: QueueStatus, limit = 20, offset = 0) {
  return useQuery<QueueListResponse>({
    queryKey: ["queue", status, limit, offset],
    queryFn: () => fetchQueue(status, limit, offset),
    refetchInterval: 30_000,
  });
}

export function useQueueItem(assetId: string) {
  return useQuery({
    queryKey: ["queue-item", assetId],
    queryFn: () => fetchQueueItem(assetId),
    enabled: !!assetId,
  });
}

export function useApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assetId,
      body,
    }: {
      assetId: string;
      body: ApproveRequest;
    }) => approveItem(assetId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["queue-stats"] });
      qc.invalidateQueries({ queryKey: ["sb-queue"] });
      qc.invalidateQueries({ queryKey: ["sb-queue-item"] });
    },
  });
}

export function useReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assetId,
      body,
    }: {
      assetId: string;
      body: RejectRequest;
    }) => rejectItem(assetId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["queue-stats"] });
      qc.invalidateQueries({ queryKey: ["sb-queue"] });
      qc.invalidateQueries({ queryKey: ["sb-queue-item"] });
    },
  });
}
