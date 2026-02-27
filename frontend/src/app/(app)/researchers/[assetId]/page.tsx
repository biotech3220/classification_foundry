"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/queue/status-badge";
import { ConfidenceBar } from "@/components/queue/confidence-bar";
import { CodeList } from "@/components/review/code-list";
import { ConstraintFlags } from "@/components/review/constraint-flags";
import { DetailSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { useResearcherDetail } from "@/lib/hooks/use-researchers";
import { parseAssetId, relativeTime } from "@/lib/utils/format";
import { confidenceColor, confidencePercent } from "@/lib/utils/confidence";
import { parseEnrichedCodes, type EnrichedCode } from "@/lib/utils/enriched-codes";
import {
  getCodeDescription,
  getCodeDivision,
  getCodeGroup,
} from "@/lib/data/anzsrc-codes";

const LANGFUSE_BASE =
  process.env.NEXT_PUBLIC_LANGFUSE_URL || "https://cloud.langfuse.com";

function safeParseJson(
  raw: string | unknown[] | null | undefined
): unknown[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw as string);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function PrimaryCodeCard({
  enriched,
}: {
  enriched: EnrichedCode;
}) {
  const confidence = enriched.confidence;
  const [open, setOpen] = useState(false);
  const hasReasoning = !!enriched.reasoning;

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-bold text-primary">
          {enriched.code}
        </span>
        {confidence !== undefined && (
          <span className="font-mono text-xs text-muted-foreground">
            {(confidence * 100).toFixed(0)}%
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-foreground">
        {getCodeDescription(enriched.code)}
      </p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">
        {getCodeDivision(enriched.code)} &rsaquo; {getCodeGroup(enriched.code)}
      </p>
      {hasReasoning && (
        <div className="mt-1.5">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/70 hover:text-muted-foreground transition-colors"
          >
            <ChevronDown
              className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
            Why this code?
          </button>
          <div
            className={`overflow-hidden transition-all duration-200 ${open ? "max-h-48 opacity-100 mt-1.5" : "max-h-0 opacity-0"}`}
          >
            <p className="text-xs text-muted-foreground leading-relaxed">
              {enriched.reasoning}
            </p>
            {enriched.evidence && enriched.evidence.length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {enriched.evidence.map((e, i) => (
                  <li
                    key={i}
                    className="text-[10px] italic text-muted-foreground/70 leading-snug pl-2 border-l border-muted-foreground/20"
                  >
                    {e}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResearcherDetailPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = use(params);
  const decodedAssetId = decodeURIComponent(assetId);

  const { data, isLoading, isError, refetch } =
    useResearcherDetail(decodedAssetId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link href="/researchers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Researchers
          </Button>
        </Link>
        <DetailSkeleton />
      </div>
    );
  }

  if (isError || !data?.queue) {
    return (
      <div className="space-y-6">
        <Link href="/researchers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Researchers
          </Button>
        </Link>
        <ErrorState
          message="Failed to load researcher"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const item = data.queue;
  const classification = data.classification;
  const { displayName } = parseAssetId(item.asset_id);

  const flags = item.assessment_flags ?? {};
  const constraintFlags: string[] = flags.constraint_flags ?? [];
  const dataQualityWarnings: string[] = (flags.data_quality_warnings as string[]) ?? [];
  const crosswalkAlignment = flags.crosswalk_alignment as number | undefined;

  // Parse enriched ANZSRC codes (handles both old string[] and new object[] formats)
  const enrichedCodes = parseEnrichedCodes(classification?.primary_codes);
  const primaryCodes = enrichedCodes.map((e) => e.code);
  const crosswalkCodesRaw = safeParseJson(classification?.standard_b_codes);
  const crosswalkCodes = crosswalkCodesRaw as (string | Record<string, unknown>)[];
  const crosswalkConfidences = crosswalkCodesRaw
    .map((c) => (typeof c === "object" && c !== null ? (c as Record<string, unknown>).confidence as number : undefined))
    .filter((c): c is number => c !== undefined);
  const langfuseTraceId = classification?.langfuse_trace_id;

  const primarySlice = enrichedCodes.slice(0, 3);
  const secondarySlice = enrichedCodes.slice(3);

  const langfuseUrl = langfuseTraceId
    ? `${LANGFUSE_BASE}/trace/${langfuseTraceId}`
    : null;

  const isPending = item.status === "pending_review";

  return (
    <div className="space-y-6">
      {/* Header */}
      <Link href="/researchers">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Researchers
        </Button>
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Researcher header */}
          <Card className="border-border bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-lg font-semibold">{displayName}</h1>
                  <p className="font-mono text-xs text-muted-foreground">
                    {item.asset_id}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-2xl font-bold font-mono ${confidenceColor(
                        item.confidence
                      )}`}
                    >
                      {confidencePercent(item.confidence)}
                    </span>
                    <ConfidenceBar
                      confidence={item.confidence}
                      showLabel={false}
                    />
                  </div>
                </div>
                <Separator
                  orientation="vertical"
                  className="hidden h-10 sm:block"
                />
                <div>
                  <p className="text-xs text-muted-foreground">Threshold</p>
                  <p className="font-mono text-sm">{item.threshold_applied}</p>
                </div>
                <Separator
                  orientation="vertical"
                  className="hidden h-10 sm:block"
                />
                <div>
                  <p className="text-xs text-muted-foreground">Routed</p>
                  <p className="text-sm">{relativeTime(item.routed_at)}</p>
                </div>
                {item.approved_at && (
                  <>
                    <Separator
                      orientation="vertical"
                      className="hidden h-10 sm:block"
                    />
                    <div>
                      <p className="text-xs text-muted-foreground">Approved</p>
                      <p className="text-sm">{relativeTime(item.approved_at)}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ANZSRC Codes */}
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="text-sm">
                ANZSRC FoR Classifications
                {classification?.code_count !== undefined && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({classification.code_count} total)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary codes — large cards with expandable reasoning */}
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                  Primary Codes
                </h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  {primarySlice.map((enriched) => (
                    <PrimaryCodeCard
                      key={enriched.code}
                      enriched={enriched}
                    />
                  ))}
                </div>
              </div>

              {/* Secondary codes — badges with tooltip reasoning */}
              {secondarySlice.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                    Secondary Codes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                      {secondarySlice.map((enriched, idx) => {
                        const badge = (
                          <Badge
                            variant="outline"
                            className={`font-mono text-xs gap-1.5 ${enriched.reasoning ? "cursor-default" : ""}`}
                            title={
                              !enriched.reasoning
                                ? getCodeDescription(enriched.code)
                                : undefined
                            }
                          >
                            {enriched.code}
                            <span className="text-muted-foreground">
                              {getCodeDescription(enriched.code).length > 30
                                ? getCodeDescription(enriched.code).slice(0, 30) + "..."
                                : getCodeDescription(enriched.code)}
                            </span>
                            {enriched.confidence !== undefined && (
                              <span className="text-muted-foreground/60">
                                {(enriched.confidence * 100).toFixed(0)}%
                              </span>
                            )}
                          </Badge>
                        );

                        if (enriched.reasoning) {
                          return (
                            <Tooltip key={enriched.code}>
                              <TooltipTrigger asChild>{badge}</TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>{enriched.reasoning}</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        }

                        return (
                          <span key={enriched.code}>{badge}</span>
                        );
                      })}
                    </TooltipProvider>
                  </div>
                </div>
              )}

              <Separator />

              {/* OECD Crosswalk */}
              <CodeList
                title="OECD FOS (Crosswalk)"
                codes={crosswalkCodes}
                confidences={crosswalkConfidences}
                variant="crosswalk"
              />

              {crosswalkAlignment !== undefined && (
                <p className="text-xs text-muted-foreground">
                  Crosswalk alignment:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {(crosswalkAlignment * 100).toFixed(1)}%
                  </span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Constraint Assessment */}
          {(constraintFlags.length > 0 || dataQualityWarnings.length > 0) && (
            <Card className="border-border bg-card/50">
              <CardHeader>
                <CardTitle className="text-sm">Constraint Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <ConstraintFlags flags={constraintFlags} dataQualityWarnings={dataQualityWarnings} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar (1/3) */}
        <div className="lg:sticky lg:top-6 lg:self-start space-y-6">
          {/* Timeline */}
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="text-sm">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {item.created_at && (
                  <TimelineEntry label="Created" date={item.created_at} />
                )}
                {item.routed_at && (
                  <TimelineEntry label="Routed" date={item.routed_at} />
                )}
                {item.approved_at && (
                  <TimelineEntry label="Approved" date={item.approved_at} />
                )}
                {item.synced && (
                  <TimelineEntry label="Synced to Neo4j" date={item.updated_at} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="text-sm">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isPending && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link
                    href={`/queue/${encodeURIComponent(item.asset_id)}`}
                  >
                    Review in Queue
                  </Link>
                </Button>
              )}
              {langfuseUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs"
                  asChild
                >
                  <a
                    href={langfuseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Langfuse Trace
                  </a>
                </Button>
              )}
              {!isPending && !langfuseUrl && (
                <p className="text-xs text-muted-foreground/50">
                  No actions available
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TimelineEntry({
  label,
  date,
}: {
  label: string;
  date: string | null;
}) {
  if (!date) return null;
  const d = new Date(date);
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">
        {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
}
