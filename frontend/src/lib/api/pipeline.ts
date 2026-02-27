import { ApiError } from "./client";

// --- Types ---

export type StageStatus = "pending" | "running" | "completed" | "failed" | "skipped";
export type PipelineJobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface PipelineStageStatus {
  stage: string;
  label: string;
  status: StageStatus;
  started_at: string | null;
  completed_at: string | null;
  result: Record<string, unknown> | null;
  error: string | null;
}

export interface PipelineRunResponse {
  job_id: string;
  stages: string[];
  status: string;
  message: string;
}

export interface PipelineStatusResponse {
  job_id: string;
  status: PipelineJobStatus;
  stages: PipelineStageStatus[];
  current_stage: string | null;
  started_at: string | null;
  completed_at: string | null;
}

// --- API Functions ---

export async function runPipeline(
  stages: string[],
  options?: { limit?: number; asset_ids?: string[] }
): Promise<PipelineRunResponse> {
  const res = await fetch("/api/foundry/v1/pipeline/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stages,
      limit: options?.limit,
      asset_ids: options?.asset_ids,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail || res.statusText);
  }

  return res.json();
}

export async function runPipelineWithUpload(
  file: File,
  stages: string[] = ["ingest", "fabricate", "classify", "route", "sync"],
  limit?: number
): Promise<PipelineRunResponse> {
  const formData = new FormData();
  formData.append("file", file);

  let url = `/api/foundry/v1/pipeline/run-with-upload?stages=${stages.join(",")}`;
  if (limit) url += `&limit=${limit}`;

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail || res.statusText);
  }

  return res.json();
}

export async function cancelPipeline(jobId: string): Promise<{ status: string; message: string }> {
  const res = await fetch(`/api/foundry/v1/pipeline/cancel/${jobId}`, {
    method: "POST",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail || res.statusText);
  }

  return res.json();
}

export async function getPipelineStatus(
  jobId: string
): Promise<PipelineStatusResponse> {
  const res = await fetch(`/api/foundry/v1/pipeline/status/${jobId}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail || res.statusText);
  }

  return res.json();
}
