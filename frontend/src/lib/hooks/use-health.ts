"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchHealth,
  fetchQueueStats,
  fetchClassificationQuality,
} from "@/lib/api/health";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    refetchInterval: 30_000,
  });
}

export function useQueueStats() {
  return useQuery({
    queryKey: ["queue-stats"],
    queryFn: fetchQueueStats,
    refetchInterval: 15_000,
  });
}

export function useClassificationQuality() {
  return useQuery({
    queryKey: ["classification-quality"],
    queryFn: fetchClassificationQuality,
    refetchInterval: 60_000,
  });
}
