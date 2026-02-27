"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SLAResponse, FreshnessResponse } from "@/lib/types";

export function SLAPanel({ sla }: { sla: SLAResponse | undefined }) {
  if (!sla?.pipeline) {
    return (
      <Card className="border-border bg-card/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">No SLA data available.</p>
        </CardContent>
      </Card>
    );
  }

  const p = sla.pipeline;
  const isHealthy = p.scan_coverage_pct >= 80 && p.overdue_scans === 0;

  return (
    <Card className="border-border bg-card/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Pipeline SLA</CardTitle>
          <Badge
            variant="outline"
            className={
              isHealthy
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }
          >
            {isHealthy ? "Healthy" : "Needs Attention"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Scan Coverage</p>
            <p className="text-lg font-bold font-mono">
              {p.scan_coverage_pct.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Refab Success Rate</p>
            <p className="text-lg font-bold font-mono">
              {p.refabrication_success_rate.toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Refab Time</p>
            <p className="text-lg font-bold font-mono">
              {p.avg_refab_duration_seconds.toFixed(1)}s
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Overdue Scans</p>
            <p className={`text-lg font-bold font-mono ${p.overdue_scans > 0 ? "text-amber-400" : ""}`}>
              {p.overdue_scans}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Retry Rate</p>
            <p className="text-lg font-bold font-mono">
              {p.retry_rate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Abandoned Rate</p>
            <p className="text-lg font-bold font-mono">
              {p.abandoned_rate.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FreshnessPanel({
  freshness,
}: {
  freshness: FreshnessResponse | undefined;
}) {
  const f = freshness?.freshness;

  if (!f) {
    return (
      <Card className="border-border bg-card/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">No freshness data available.</p>
        </CardContent>
      </Card>
    );
  }

  const items = [
    { label: "Fresh", value: f.fresh_count, pct: f.fresh_pct, color: "text-emerald-400", bg: "bg-emerald-500" },
    { label: "Aging", value: f.aging_count, pct: f.aging_pct, color: "text-amber-400", bg: "bg-amber-500" },
    { label: "Stale", value: f.stale_count, pct: f.stale_pct, color: "text-red-400", bg: "bg-red-500" },
  ];

  return (
    <Card className="border-border bg-card/50">
      <CardHeader>
        <CardTitle className="text-sm">Data Freshness</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className={`font-mono font-medium ${item.color}`}>
                  {item.value} ({item.pct.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className={`h-2 rounded-full ${item.bg}`}
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Total: {f.total_active} entities
        </p>
      </CardContent>
    </Card>
  );
}
