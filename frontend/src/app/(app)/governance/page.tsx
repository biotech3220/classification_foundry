"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCard } from "@/components/governance/alert-card";
import { FreshnessPanel } from "@/components/governance/sla-panel";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useAlerts, useFreshness } from "@/lib/hooks/use-governance";

export default function GovernancePage() {
  const [severity, setSeverity] = useState<string | undefined>(undefined);
  const { data: alerts, isLoading, isError, refetch } = useAlerts(severity);
  const { data: freshness } = useFreshness();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Governance</h1>
        <p className="text-sm text-muted-foreground">
          Pipeline alerts and data freshness
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Alerts (2/3) */}
        <div className="space-y-4 lg:col-span-2">
          <Tabs
            value={severity ?? "all"}
            onValueChange={(v) => setSeverity(v === "all" ? undefined : v)}
          >
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all" className="data-[state=active]:bg-background">
                All
              </TabsTrigger>
              <TabsTrigger value="critical" className="data-[state=active]:bg-background">
                Critical
              </TabsTrigger>
              <TabsTrigger value="warning" className="data-[state=active]:bg-background">
                Warning
              </TabsTrigger>
              <TabsTrigger value="info" className="data-[state=active]:bg-background">
                Info
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <ErrorState
              message="Failed to load alerts"
              onRetry={() => refetch()}
            />
          ) : !alerts?.length ? (
            <EmptyState
              title="No alerts"
              description="All systems operating normally."
            />
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <AlertCard key={alert.alert_id} alert={alert} />
              ))}
            </div>
          )}
        </div>

        {/* Freshness (1/3) */}
        <div>
          <FreshnessPanel freshness={freshness} />
        </div>
      </div>
    </div>
  );
}
