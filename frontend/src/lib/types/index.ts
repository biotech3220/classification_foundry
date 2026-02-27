// --- Queue / Curator types ---

export interface QueueItem {
  asset_id: string;
  queue: string;
  status: QueueStatus;
  confidence: number;
  threshold_applied: string;
  routing_reason: string;
  assessment_flags: AssessmentFlags;
  escalation_flags: EscalationFlag[];
  routed_at: string | null;
  approved_at: string | null;
  curator_id: string | null;
  curator_notes: string | null;
  rejection_type: RejectionType | null;
  correct_codes: string[] | null;
  synced: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export type QueueStatus =
  | "auto_approved"
  | "pending_review"
  | "curator_approved"
  | "rejected"
  | "synced";

export type RejectionType = "reclassify" | "refabricate" | "reingest";

export interface AssessmentFlags {
  crosswalk_alignment?: number;
  constraint_flags?: string[];
  warnings?: string[];
  classification_confidence?: {
    standard_a?: number[];
    standard_b?: number[];
  };
  [key: string]: unknown;
}

export interface EscalationFlag {
  type: string;
  value: number;
  threshold: number;
}

export interface QueueListResponse {
  items: QueueItem[];
  total: number;
  limit: number;
  offset: number;
}

// --- Classification details ---

export interface ObjectClassification {
  asset_id: string;
  code_count: number;
  avg_confidence: number;
  primary_codes: string;
  standard_b_codes: string;
  langfuse_trace_id: string | null;
  primary_source: string | null;
}

// --- Curator action types ---

export interface ApproveRequest {
  curator_id: string;
  notes?: string;
  code_quality?: number;
  data_quality?: number;
  curator_confidence?: number;
}

export interface RejectRequest {
  curator_id: string;
  rejection_type: RejectionType;
  notes: string;
  correct_codes?: string[];
  code_quality?: number;
  data_quality?: number;
}

export interface CuratorActionResponse {
  asset_id: string;
  status: string;
  action_at: string;
}

// --- Health types ---

export interface HealthResponse {
  status: "ok" | "degraded";
  checks: Record<string, "ok" | "fail">;
}

export interface QueueStatsResponse {
  auto_approved: number;
  pending_review: number;
  curator_approved: number;
  rejected: number;
  synced: number;
}

export interface ClassificationQuality {
  overall_approval_rate: number;
  total_curated: number;
  auto_approve_threshold: number;
  code_stats: {
    standard_code: string;
    total_assigned: number;
    total_approved: number;
    total_rejected: number;
    approval_rate: number;
    avg_machine_confidence: number;
    difficulty_score: number;
    last_updated: string;
  }[];
  adapter_quality: {
    primary_source: string;
    total_classified: number;
    total_rejected: number;
    reingest_rate: number;
    refabricate_rate: number;
    reclassify_rate: number;
    last_updated: string;
  }[];
  calibration: {
    confidence_band_lower: number;
    confidence_band_upper: number;
    sample_size: number;
    approval_rate: number;
    recommended_routing: string;
    last_updated: string;
  }[];
}

// --- Governance types ---

export interface GovernanceAlert {
  alert_id: string;
  alert_type: string;
  severity: "critical" | "warning" | "info";
  message: string;
  details: Record<string, unknown>;
  first_fired_at: string;
  last_fired_at: string;
  fire_count: number;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
}

export interface FreshnessResponse {
  freshness: {
    total_active: number;
    fresh_count: number;
    aging_count: number;
    stale_count: number;
    unknown_count: number;
    fresh_pct: number;
    aging_pct: number;
    stale_pct: number;
    avg_freshness_score: number;
  } | null;
  snapshot_at: string;
}

export interface SLAResponse {
  pipeline: {
    scan_coverage_pct: number;
    refabrication_success_rate: number;
    avg_refab_duration_seconds: number;
    overdue_scans: number;
    retry_rate: number;
    abandoned_rate: number;
  } | null;
  snapshot_at: string;
}

// --- Pipeline types ---

export type PipelineStageName = "ingest" | "fabricate" | "classify" | "route" | "sync";

export interface PipelineStage {
  name: PipelineStageName;
  label: string;
  description: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  { name: "ingest", label: "OBJECT-1: Ingestion", description: "Parse CSV and scrape live sources" },
  { name: "fabricate", label: "OBJECT-2: Fabrication", description: "Build enriched FATObjects from raw data" },
  { name: "classify", label: "OBJECT-3: Classification", description: "Assign ANZSRC + OECD codes via LLM" },
  { name: "route", label: "OBJECT-4: Routing", description: "Route to auto-approve or curator queue" },
  { name: "sync", label: "OBJECT-5: Sync", description: "Sync approved entries to Neo4j" },
];

// --- Researcher types ---

export interface ResearcherListItem {
  asset_id: string;
  status: QueueStatus;
  confidence: number;
  routed_at: string | null;
  approved_at: string | null;
  primary_codes: string | string[] | null;
  standard_b_codes: string | string[] | null;
  avg_confidence: number | null;
}
