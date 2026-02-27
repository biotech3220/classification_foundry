import { cn } from "@/lib/utils";
import { confidenceBgColor, confidencePercent } from "@/lib/utils/confidence";

export function ConfidenceBar({
  confidence,
  showLabel = true,
}: {
  confidence: number;
  showLabel?: boolean;
}) {
  const pct = Math.round(confidence * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-muted">
        <div
          className={cn("h-2 rounded-full transition-all", confidenceBgColor(confidence))}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="font-mono text-xs text-muted-foreground">
          {confidencePercent(confidence)}
        </span>
      )}
    </div>
  );
}
