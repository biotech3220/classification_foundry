"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/queue/status-badge";
import { ConfidenceBar } from "@/components/queue/confidence-bar";
import { CodeList } from "@/components/review/code-list";
import { ConstraintFlags } from "@/components/review/constraint-flags";
import { ApprovalForm } from "@/components/review/approval-form";
import { RejectionDialog } from "@/components/review/rejection-dialog";
import { DetailSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import {
  useSupabaseQueueItem,
  useClassificationDetail,
} from "@/lib/hooks/use-supabase-query";
import { useAuth } from "@/lib/hooks/use-auth";
import { parseAssetId, relativeTime } from "@/lib/utils/format";
import { confidenceColor, confidencePercent } from "@/lib/utils/confidence";
import { parseEnrichedCodes, type EnrichedCode } from "@/lib/utils/enriched-codes";

const LANGFUSE_BASE = process.env.NEXT_PUBLIC_LANGFUSE_URL || "https://cloud.langfuse.com";

function safeParseJsonArray(raw: string | unknown[] | null | undefined): unknown[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw as string);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ReviewDetailPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = use(params);
  const decodedAssetId = decodeURIComponent(assetId);
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);

  const { curatorId } = useAuth();
  const {
    data: item,
    isLoading: itemLoading,
    isError: itemError,
    refetch,
  } = useSupabaseQueueItem(decodedAssetId);
  const { data: classification, isLoading: classLoading } =
    useClassificationDetail(decodedAssetId);

  const isLoading = itemLoading || classLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Queue
        </Button>
        <DetailSkeleton />
      </div>
    );
  }

  if (itemError || !item) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Queue
        </Button>
        <ErrorState
          message="Failed to load queue item"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { displayName } = parseAssetId(item.asset_id);
  const flags = item.assessment_flags;
  const constraintFlags = flags?.constraint_flags ?? [];
  const warnings = flags?.warnings ?? [];
  const dataQualityWarnings: string[] = (flags?.data_quality_warnings as string[]) ?? [];
  const escalationFlags = item.escalation_flags ?? [];
  const crosswalkAlignment = flags?.crosswalk_alignment;
  const isPending = item.status === "pending_review";

  // Parse enriched ANZSRC codes (handles both old string[] and new object[] formats)
  const enrichedCodes = parseEnrichedCodes(classification?.primary_codes);
  const primaryCodes = enrichedCodes.map((e) => e.code);
  const standardAConfidences = enrichedCodes.map((e) => e.confidence).filter((c): c is number => c !== undefined);
  const reasoningMap = new Map<string, EnrichedCode>(
    enrichedCodes.filter((e) => e.reasoning).map((e) => [e.code, e])
  );

  const crosswalkCodesRaw = safeParseJsonArray(classification?.standard_b_codes);
  const crosswalkCodes = crosswalkCodesRaw as (string | Record<string, unknown>)[];
  const standardBConfidences = crosswalkCodesRaw
    .map((c) => (typeof c === "object" && c !== null ? (c as Record<string, unknown>).confidence as number : undefined))
    .filter((c): c is number => c !== undefined);
  const langfuseTraceId = classification?.langfuse_trace_id;
  const SOURCE_LABELS: Record<string, string> = {
    orcid: "ORCID",
    openalex: "OpenAlex",
    scopus: "Scopus",
    scholar: "Scholar",
    patents: "Patents",
    uni: "University",
    university_profile: "University",
    brave: "Brave",
    brave_profile: "Brave",
    brave_search: "Brave",
    inst: "Institution",
    institutional_page: "Institution",
  };
  const dataSources = classification?.primary_source
    ? classification.primary_source.split(",").filter(Boolean)
    : [];

  // Split primary codes into primary (first 3) and secondary (rest)
  const primarySlice = primaryCodes.slice(0, 3);
  const secondarySlice = primaryCodes.slice(3);

  const langfuseUrl = langfuseTraceId
    ? `${LANGFUSE_BASE}/trace/${langfuseTraceId}`
    : null;

  function handleSuccess() {
    router.push("/queue");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left panel (2/3) */}
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
                    <ConfidenceBar confidence={item.confidence} showLabel={false} />
                  </div>
                </div>
                <Separator orientation="vertical" className="hidden h-10 sm:block" />
                <div>
                  <p className="text-xs text-muted-foreground">Threshold</p>
                  <p className="font-mono text-sm">{item.threshold_applied}</p>
                </div>
                <Separator orientation="vertical" className="hidden h-10 sm:block" />
                <div>
                  <p className="text-xs text-muted-foreground">Routed</p>
                  <p className="text-sm">{relativeTime(item.routed_at)}</p>
                </div>
                {dataSources.length > 0 && (
                  <>
                    <Separator orientation="vertical" className="hidden h-10 sm:block" />
                    <div>
                      <p className="text-xs text-muted-foreground">Sources</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {dataSources.map((src) => (
                          <Badge key={src} variant="outline" className="text-xs">
                            {SOURCE_LABELS[src] ?? src}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {item.routing_reason}
              </p>
            </CardContent>
          </Card>

          {/* Codes */}
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="text-sm">
                Classification Codes
                {classification?.code_count !== undefined && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({classification.code_count} total)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeList
                title="ANZSRC FoR (Primary)"
                codes={primarySlice}
                confidences={standardAConfidences.slice(0, 3)}
                variant="primary"
                reasoning={reasoningMap.size > 0 ? reasoningMap : undefined}
              />
              <CodeList
                title="ANZSRC FoR (Secondary)"
                codes={secondarySlice}
                confidences={standardAConfidences.slice(3)}
                variant="secondary"
                reasoning={reasoningMap.size > 0 ? reasoningMap : undefined}
              />
              <Separator />
              <CodeList
                title="OECD FOS (Crosswalk)"
                codes={crosswalkCodes}
                confidences={standardBConfidences}
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

          {/* Assessment flags */}
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="text-sm">Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ConstraintFlags flags={constraintFlags} dataQualityWarnings={dataQualityWarnings} />

              {warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Warnings
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {warnings.map((w) => (
                      <Badge
                        key={w}
                        variant="outline"
                        className="gap-1 bg-amber-500/10 text-amber-400 border-amber-500/20"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {w}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {escalationFlags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Escalation Flags
                  </h4>
                  {escalationFlags.map((flag, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs"
                    >
                      <span className="font-medium text-red-400">{flag.type}</span>
                      <span className="text-muted-foreground">
                        {" "}&mdash; value: {flag.value}, threshold: {flag.threshold}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Langfuse trace link */}
              {langfuseUrl ? (
                <Button variant="outline" size="sm" className="gap-2 text-xs" asChild>
                  <a href={langfuseUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                    View Langfuse Trace
                  </a>
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground/50">
                  No Langfuse trace available
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right panel (1/3) — sticky action sidebar */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="text-sm">Curator Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isPending ? (
                <>
                  <ApprovalForm
                    assetId={item.asset_id}
                    curatorId={curatorId}
                    onSuccess={handleSuccess}
                  />
                  <Separator />
                  <Button
                    variant="outline"
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => setRejectOpen(true)}
                  >
                    Reject Classification
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    This item has already been{" "}
                    <span className="font-medium text-foreground">
                      {item.status === "curator_approved"
                        ? "approved"
                        : item.status === "rejected"
                          ? "rejected"
                          : item.status}
                    </span>
                    .
                  </p>
                  {item.curator_id && (
                    <p className="text-xs text-muted-foreground">
                      By: {item.curator_id}
                    </p>
                  )}
                  {item.curator_notes && (
                    <p className="text-xs text-muted-foreground">
                      Notes: {item.curator_notes}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rejection dialog */}
      <RejectionDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        assetId={item.asset_id}
        curatorId={curatorId}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
