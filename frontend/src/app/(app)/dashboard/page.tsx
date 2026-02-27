"use client";

import {
  Clock,
  CheckCircle2,
  UserCheck,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { HealthIndicator } from "@/components/dashboard/health-indicator";
import { QueueChart } from "@/components/dashboard/queue-chart";
import { ConfidenceChart } from "@/components/dashboard/confidence-chart";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { useQueueStats, useHealth, useClassificationQuality } from "@/lib/hooks/use-health";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQueueStats();
  const { data: health } = useHealth();
  const { data: quality, isLoading: qualityLoading } = useClassificationQuality();

  const approvalRate =
    stats && stats.auto_approved + stats.curator_approved > 0
      ? (
          ((stats.auto_approved + stats.curator_approved) /
            (stats.auto_approved +
              stats.curator_approved +
              stats.pending_review +
              stats.rejected)) *
          100
        ).toFixed(1)
      : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Pipeline overview and system health
          </p>
        </div>
        <HealthIndicator health={health} />
      </div>

      {/* Stat cards */}
      {statsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Pending Review"
            value={stats.pending_review}
            icon={Clock}
            href="/queue?status=pending_review"
            colorClass="text-amber-400"
          />
          <StatCard
            label="Auto-approved"
            value={stats.auto_approved}
            icon={CheckCircle2}
            href="/queue?status=auto_approved"
            colorClass="text-emerald-400"
          />
          <StatCard
            label="Curator Approved"
            value={stats.curator_approved}
            icon={UserCheck}
            href="/queue?status=curator_approved"
            colorClass="text-emerald-400"
          />
          <StatCard
            label="Rejected"
            value={stats.rejected}
            icon={XCircle}
            href="/queue?status=rejected"
            colorClass="text-red-400"
          />
          <StatCard
            label="Synced"
            value={stats.synced}
            icon={RefreshCw}
            colorClass="text-indigo-400"
          />
        </div>
      ) : null}

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Queue depth donut */}
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm">Queue Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <QueueChart stats={stats} />
            ) : (
              <CardSkeleton />
            )}
          </CardContent>
        </Card>

        {/* Confidence histogram */}
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm">Confidence Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {qualityLoading ? (
              <CardSkeleton />
            ) : quality ? (
              <ConfidenceChart quality={quality} />
            ) : (
              <p className="text-xs text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approval rate */}
      <Card className="border-border bg-card/50">
        <CardContent className="flex items-center gap-6 pt-6">
          <div>
            <p className="text-xs text-muted-foreground">Overall Approval Rate</p>
            <p className="text-3xl font-bold font-mono text-emerald-400">
              {approvalRate}%
            </p>
          </div>
          {quality && (
            <>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-xs text-muted-foreground">Total Curated</p>
                <p className="text-3xl font-bold font-mono text-primary">
                  {quality.total_curated}
                </p>
              </div>
            </>
          )}
          {quality?.auto_approve_threshold !== undefined && (
            <>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-xs text-muted-foreground">Auto-approve Threshold</p>
                <p className="text-3xl font-bold font-mono text-muted-foreground">
                  {(quality.auto_approve_threshold * 100).toFixed(0)}%
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
