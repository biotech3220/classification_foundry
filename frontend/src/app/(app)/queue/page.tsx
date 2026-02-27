"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { QueueTable } from "@/components/queue/queue-table";
import { QueueCards } from "@/components/queue/queue-cards";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useSupabaseQueue } from "@/lib/hooks/use-supabase-query";
import { useQueueStats } from "@/lib/hooks/use-health";
import type { QueueStatus } from "@/lib/types";

const PAGE_SIZE = 20;

const TABS: { value: QueueStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending_review", label: "Pending" },
  { value: "auto_approved", label: "Auto-approved" },
  { value: "curator_approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function QueuePage() {
  const [statusFilter, setStatusFilter] = useState<QueueStatus | "all">("all");
  const [page, setPage] = useState(0);

  const status = statusFilter === "all" ? undefined : statusFilter;
  const { data, isLoading, isError, refetch } = useSupabaseQueue(
    status,
    PAGE_SIZE,
    page * PAGE_SIZE
  );
  const { data: stats } = useQueueStats();

  function badgeCount(s: QueueStatus | "all"): number | undefined {
    if (!stats) return undefined;
    if (s === "all")
      return (
        stats.auto_approved +
        stats.pending_review +
        stats.curator_approved +
        stats.rejected
      );
    return stats[s as keyof typeof stats];
  }

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Curator Queue</h1>
        <p className="text-sm text-muted-foreground">
          Review and manage classification decisions
        </p>
      </div>

      <Tabs
        value={statusFilter}
        onValueChange={(v) => {
          setStatusFilter(v as QueueStatus | "all");
          setPage(0);
        }}
      >
        <TabsList className="bg-muted/50">
          {TABS.map((tab) => {
            const count = badgeCount(tab.value);
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-2 data-[state=active]:bg-background"
              >
                {tab.label}
                {count !== undefined && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]"
                  >
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <div className="rounded-xl border border-border bg-card/50">
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton />
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load queue" onRetry={() => refetch()} />
        ) : !data?.items.length ? (
          <EmptyState
            title="Queue is empty"
            description="No items match the current filter."
          />
        ) : (
          <>
            {/* Desktop: table */}
            <div className="hidden md:block">
              <QueueTable items={data.items} />
            </div>
            {/* Mobile: cards */}
            <div className="md:hidden">
              <QueueCards items={data.items} />
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages} ({data?.total} items)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
