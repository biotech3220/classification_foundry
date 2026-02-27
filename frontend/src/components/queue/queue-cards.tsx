"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { ConfidenceBar } from "./confidence-bar";
import { parseAssetId, relativeTime } from "@/lib/utils/format";
import type { QueueItem } from "@/lib/types";

export function QueueCards({ items }: { items: QueueItem[] }) {
  const router = useRouter();

  return (
    <div className="space-y-2 p-3">
      {items.map((item) => {
        const { displayName } = parseAssetId(item.asset_id);
        const warningCount = item.assessment_flags?.warnings?.length ?? 0;

        return (
          <Card
            key={item.asset_id}
            className="cursor-pointer border-border bg-card/50 transition-colors duration-150 hover:bg-accent/50"
            onClick={() =>
              router.push(`/queue/${encodeURIComponent(item.asset_id)}`)
            }
          >
            <CardContent className="space-y-2 pt-4 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {item.asset_id}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <div className="flex items-center justify-between">
                <ConfidenceBar confidence={item.confidence} />
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {warningCount > 0 && (
                    <span className="text-amber-400">{warningCount} warn</span>
                  )}
                  <span>{relativeTime(item.routed_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
