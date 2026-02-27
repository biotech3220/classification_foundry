"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/queue/status-badge";
import { ConfidenceBar } from "@/components/queue/confidence-bar";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useResearchers } from "@/lib/hooks/use-researchers";
import { parseAssetId, relativeTime } from "@/lib/utils/format";
import { getCodeDescription } from "@/lib/data/anzsrc-codes";
import { parseEnrichedCodes } from "@/lib/utils/enriched-codes";
import { useDebounce } from "@/lib/hooks/use-debounce";

const PAGE_SIZE = 20;

export default function ResearchersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError, refetch } = useResearchers(
    debouncedSearch,
    page,
    PAGE_SIZE
  );

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Researchers</h1>
          <p className="text-sm text-muted-foreground">
            Search and browse classified researchers
            {data && (
              <span className="ml-1 font-mono">({data.total} total)</span>
            )}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search by name..."
          className="pl-9 bg-background"
        />
      </div>

      {/* Loading */}
      {isLoading && <TableSkeleton />}

      {/* Error */}
      {isError && (
        <ErrorState message="Failed to load researchers" onRetry={() => refetch()} />
      )}

      {/* Empty */}
      {data && data.items.length === 0 && (
        <EmptyState
          title="No researchers found"
          description={
            search
              ? `No researchers match "${search}"`
              : "No researchers in the system yet. Run the pipeline to get started."
          }
        />
      )}

      {/* Results table */}
      {data && data.items.length > 0 && (
        <Card className="border-border bg-card/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Confidence</TableHead>
                    <TableHead className="text-xs">Primary Codes</TableHead>
                    <TableHead className="text-xs text-right">Routed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item) => {
                    const { displayName } = parseAssetId(item.asset_id);
                    const primaryCodes = parseEnrichedCodes(item.primary_codes).slice(0, 3).map((e) => e.code);

                    return (
                      <TableRow key={item.asset_id} className="border-border group">
                        <TableCell>
                          <Link
                            href={`/researchers/${encodeURIComponent(item.asset_id)}`}
                            className="font-medium text-sm hover:text-primary transition-colors"
                          >
                            {displayName}
                          </Link>
                          <p className="font-mono text-[10px] text-muted-foreground/60">
                            {item.asset_id}
                          </p>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={item.status} />
                        </TableCell>
                        <TableCell>
                          <ConfidenceBar confidence={item.confidence} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {primaryCodes.map((code) => (
                              <Badge
                                key={code}
                                variant="outline"
                                className="text-[10px] font-mono bg-primary/5 text-primary/80 border-primary/15"
                                title={getCodeDescription(code)}
                              >
                                {code}
                              </Badge>
                            ))}
                            {primaryCodes.length === 0 && (
                              <span className="text-xs text-muted-foreground/50">
                                No codes
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {relativeTime(item.routed_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
