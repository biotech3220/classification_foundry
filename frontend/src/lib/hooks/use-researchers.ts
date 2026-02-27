"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { QueueStatus } from "@/lib/types";

export interface ResearcherRow {
  asset_id: string;
  status: QueueStatus;
  confidence: number;
  routed_at: string | null;
  approved_at: string | null;
  // Joined from object_classifications
  primary_codes: string | null;
  standard_b_codes: string | null;
  avg_confidence: number | null;
}

export function useResearchers(
  search: string,
  page: number,
  pageSize = 20,
  status?: QueueStatus
) {
  return useQuery({
    queryKey: ["researchers", search, page, pageSize, status],
    queryFn: async () => {
      const supabase = createClient();
      const offset = page * pageSize;

      // Query validation_queue
      let query = supabase
        .from("validation_queue")
        .select("asset_id, status, confidence, routed_at, approved_at", {
          count: "exact",
        })
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (status) {
        query = query.eq("status", status);
      }

      if (search) {
        // asset_id format: researcher:first-last
        query = query.ilike("asset_id", `%${search}%`);
      }

      const { data: queueItems, count, error } = await query;
      if (error) throw error;

      if (!queueItems || queueItems.length === 0) {
        return { items: [] as ResearcherRow[], total: count ?? 0 };
      }

      // Fetch classifications for these asset_ids
      const assetIds = queueItems.map((q) => q.asset_id);
      const { data: classifications } = await supabase
        .from("object_classifications")
        .select("asset_id, primary_codes, standard_b_codes, avg_confidence")
        .in("asset_id", assetIds);

      const classMap = new Map(
        (classifications ?? []).map((c) => [c.asset_id, c])
      );

      const items: ResearcherRow[] = queueItems.map((q) => {
        const cls = classMap.get(q.asset_id);
        return {
          ...q,
          primary_codes: cls?.primary_codes ?? null,
          standard_b_codes: cls?.standard_b_codes ?? null,
          avg_confidence: cls?.avg_confidence ?? null,
        };
      });

      return { items, total: count ?? 0 };
    },
    refetchInterval: 30_000,
  });
}

export function useResearcherDetail(assetId: string) {
  return useQuery({
    queryKey: ["researcher-detail", assetId],
    queryFn: async () => {
      const supabase = createClient();

      // Fetch queue item and classification in parallel
      const [queueResult, classResult] = await Promise.all([
        supabase
          .from("validation_queue")
          .select("*")
          .eq("asset_id", assetId)
          .single(),
        supabase
          .from("object_classifications")
          .select("*")
          .eq("asset_id", assetId)
          .single(),
      ]);

      if (queueResult.error && queueResult.error.code !== "PGRST116") {
        throw queueResult.error;
      }

      return {
        queue: queueResult.data,
        classification: classResult.data,
      };
    },
    enabled: !!assetId,
  });
}
