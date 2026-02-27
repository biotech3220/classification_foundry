"use client";

import { CheckCircle2, Circle, Loader2, XCircle, SkipForward } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PipelineStatusResponse, PipelineStageStatus } from "@/lib/api/pipeline";
import { cn } from "@/lib/utils";

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return "";
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const seconds = Math.round((end - start) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

function formatResult(result: Record<string, unknown> | null): string {
  if (!result) return "";
  // Show key metrics depending on what's in the result
  const parts: string[] = [];
  if (result.researchers_parsed !== undefined) parts.push(`${result.researchers_parsed} parsed`);
  if (result.thin_objects_created !== undefined) parts.push(`${result.thin_objects_created} created`);
  if (result.fat_objects_created !== undefined) parts.push(`${result.fat_objects_created} fabricated`);
  if (result.classified_count !== undefined) parts.push(`${result.classified_count} classified`);
  if (result.routed_count !== undefined) parts.push(`${result.routed_count} routed`);
  if (result.auto_approved !== undefined) parts.push(`${result.auto_approved} auto-approved`);
  if (result.synced_count !== undefined) parts.push(`${result.synced_count} synced`);
  if (result.activated_count !== undefined) parts.push(`${result.activated_count} activated`);
  return parts.join(", ");
}

function StageIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
    case "running":
      return <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />;
    case "failed":
      return <XCircle className="h-5 w-5 text-red-400" />;
    case "skipped":
      return <SkipForward className="h-4 w-4 text-muted-foreground/50" />;
    default:
      return <Circle className="h-5 w-5 text-muted-foreground/30" />;
  }
}

function StageRow({ stage, isLast }: { stage: PipelineStageStatus; isLast: boolean }) {
  const resultText = formatResult(stage.result);
  const duration = formatDuration(stage.started_at, stage.completed_at);

  return (
    <div className="flex gap-4">
      {/* Timeline column */}
      <div className="flex flex-col items-center">
        <StageIcon status={stage.status} />
        {!isLast && (
          <div
            className={cn(
              "mt-1 w-0.5 flex-1 min-h-8",
              stage.status === "completed"
                ? "bg-emerald-500/30"
                : stage.status === "running"
                  ? "bg-indigo-500/30"
                  : stage.status === "failed"
                    ? "bg-red-500/30"
                    : "bg-border"
            )}
          />
        )}
      </div>

      {/* Content column */}
      <div className="flex-1 pb-6">
        <div className="flex items-center justify-between">
          <p
            className={cn(
              "text-sm font-medium",
              stage.status === "completed" && "text-emerald-400",
              stage.status === "running" && "text-indigo-400",
              stage.status === "failed" && "text-red-400",
              stage.status === "skipped" && "text-muted-foreground/50",
              stage.status === "pending" && "text-muted-foreground"
            )}
          >
            {stage.label}
          </p>
          {duration && (
            <span className="font-mono text-xs text-muted-foreground">{duration}</span>
          )}
        </div>

        {stage.status === "running" && (
          <p className="mt-1 text-xs text-indigo-400/70 animate-pulse">Processing...</p>
        )}

        {stage.status === "completed" && resultText && (
          <p className="mt-1 text-xs text-muted-foreground">{resultText}</p>
        )}

        {stage.status === "failed" && stage.error && (
          <p className="mt-1 text-xs text-red-400/80">{stage.error}</p>
        )}

        {stage.status === "skipped" && (
          <p className="mt-1 text-xs text-muted-foreground/50">Skipped</p>
        )}
      </div>
    </div>
  );
}

export function PipelineStepper({ pipeline }: { pipeline: PipelineStatusResponse }) {
  const overallDuration = formatDuration(pipeline.started_at, pipeline.completed_at);

  return (
    <Card className="border-border bg-card/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            Pipeline: {pipeline.job_id}
          </CardTitle>
          <div className="flex items-center gap-3">
            {overallDuration && (
              <span className="font-mono text-xs text-muted-foreground">
                Total: {overallDuration}
              </span>
            )}
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                pipeline.status === "completed" && "bg-emerald-500/10 text-emerald-400",
                pipeline.status === "running" && "bg-indigo-500/10 text-indigo-400",
                pipeline.status === "failed" && "bg-red-500/10 text-red-400",
                pipeline.status === "pending" && "bg-muted text-muted-foreground"
              )}
            >
              {pipeline.status}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {pipeline.stages.map((stage, idx) => (
            <StageRow
              key={stage.stage}
              stage={stage}
              isLast={idx === pipeline.stages.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
