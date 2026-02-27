import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { QueueStatus } from "@/lib/types";

const STATUS_STYLES: Record<QueueStatus, string> = {
  pending_review: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  auto_approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  curator_approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  synced: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

const STATUS_LABELS: Record<QueueStatus, string> = {
  pending_review: "Pending",
  auto_approved: "Auto-approved",
  curator_approved: "Approved",
  rejected: "Rejected",
  synced: "Synced",
};

export function StatusBadge({ status }: { status: QueueStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", STATUS_STYLES[status])}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
