"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./status-badge";
import { ConfidenceBar } from "./confidence-bar";
import { parseAssetId, relativeTime } from "@/lib/utils/format";
import type { QueueItem } from "@/lib/types";

export function QueueTable({ items }: { items: QueueItem[] }) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="text-muted-foreground">Researcher</TableHead>
          <TableHead className="text-muted-foreground">Confidence</TableHead>
          <TableHead className="text-muted-foreground">Status</TableHead>
          <TableHead className="text-muted-foreground">Warnings</TableHead>
          <TableHead className="text-right text-muted-foreground">Routed</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const { displayName } = parseAssetId(item.asset_id);
          const warningCount = item.assessment_flags?.warnings?.length ?? 0;

          return (
            <TableRow
              key={item.asset_id}
              className="cursor-pointer border-border transition-colors duration-150 hover:bg-accent/50"
              onClick={() =>
                router.push(`/queue/${encodeURIComponent(item.asset_id)}`)
              }
            >
              <TableCell>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {displayName}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {item.asset_id}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <ConfidenceBar confidence={item.confidence} />
              </TableCell>
              <TableCell>
                <StatusBadge status={item.status} />
              </TableCell>
              <TableCell>
                {warningCount > 0 ? (
                  <span className="text-xs text-amber-400">{warningCount}</span>
                ) : (
                  <span className="text-xs text-muted-foreground/50">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <span className="text-xs text-muted-foreground">
                  {relativeTime(item.routed_at)}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
