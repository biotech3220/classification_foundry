"use client";

import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

const DATA_QUALITY_LABELS: Record<string, string> = {
  missing_publications: "Missing Publications",
  missing_biography: "Missing Biography",
  missing_keywords: "Missing Keywords",
  missing_research_domains: "Missing Research Domains",
  thin_embedding: "Thin Embedding",
  low_adapter_evidence: "Low Adapter Evidence",
};

export function ConstraintFlags({
  flags,
  dataQualityWarnings,
}: {
  flags: string[];
  dataQualityWarnings?: string[];
}) {
  if (!flags.length && !dataQualityWarnings?.length) return null;

  return (
    <div className="space-y-3">
      {flags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Constraint Flags
          </h4>
          <div className="flex flex-wrap gap-2">
            {flags.map((flag) => {
              const [name, result] = flag.split(":");
              const passed = result === "pass";

              return (
                <Badge
                  key={flag}
                  variant="outline"
                  className={
                    passed
                      ? "gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "gap-1 bg-red-500/10 text-red-400 border-red-500/20"
                  }
                >
                  {passed ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {name}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {dataQualityWarnings && dataQualityWarnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Evidence Quality Warnings
          </h4>
          <div className="flex flex-wrap gap-2">
            {dataQualityWarnings.map((w) => (
              <Badge
                key={w}
                variant="outline"
                className="gap-1 bg-amber-500/10 text-amber-400 border-amber-500/20"
              >
                <AlertTriangle className="h-3 w-3" />
                {DATA_QUALITY_LABELS[w] ?? w}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
