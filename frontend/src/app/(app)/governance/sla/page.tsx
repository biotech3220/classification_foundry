"use client";

import { SLAPanel, FreshnessPanel } from "@/components/governance/sla-panel";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { useSLA, useFreshness } from "@/lib/hooks/use-governance";
import { relativeTime } from "@/lib/utils/format";

export default function SLAPage() {
  const { data: sla, isLoading: slaLoading } = useSLA();
  const { data: freshness, isLoading: freshnessLoading } = useFreshness();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">SLA & Freshness</h1>
        <p className="text-sm text-muted-foreground">
          Pipeline compliance and data staleness monitoring
        </p>
        {sla?.snapshot_at && (
          <p className="mt-1 text-xs text-muted-foreground/70">
            Last snapshot: {relativeTime(sla.snapshot_at)}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {slaLoading ? <CardSkeleton /> : <SLAPanel sla={sla} />}
        {freshnessLoading ? <CardSkeleton /> : <FreshnessPanel freshness={freshness} />}
      </div>
    </div>
  );
}
