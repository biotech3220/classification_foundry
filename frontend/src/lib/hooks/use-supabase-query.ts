"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
  ObjectClassification,
  QueueItem,
  QueueStatus,
} from "@/lib/types";

/**
 * Direct Supabase read for the validation queue.
 * Bypasses FastAPI for simple read operations (faster, fewer hops).
 */
export function useSupabaseQueue(
  status?: QueueStatus,
  limit = 20,
  offset = 0
) {
  return useQuery({
    queryKey: ["sb-queue", status, limit, offset],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("validation_queue")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: true })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq("status", status);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      return {
        items: (data ?? []) as QueueItem[],
        total: count ?? 0,
        limit,
        offset,
      };
    },
    refetchInterval: 30_000,
  });
}

/**
 * Direct Supabase read for a single queue item.
 */
export function useSupabaseQueueItem(assetId: string) {
  return useQuery({
    queryKey: ["sb-queue-item", assetId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("validation_queue")
        .select("*")
        .eq("asset_id", assetId)
        .single();

      if (error) throw error;
      return data as QueueItem;
    },
    enabled: !!assetId,
  });
}

/**
 * Direct Supabase read for object_classifications (codes, trace ID).
 */
export function useClassificationDetail(assetId: string) {
  return useQuery({
    queryKey: ["sb-classification", assetId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("object_classifications")
        .select("*")
        .eq("asset_id", assetId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
      return (data as ObjectClassification) ?? null;
    },
    enabled: !!assetId,
  });
}
