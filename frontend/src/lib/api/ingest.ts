import { ApiError } from "./client";

export interface IngestionJobResponse {
  job_id: string;
  status: string;
  researchers_count: number;
  message: string;
}

export interface IngestionStatusResponse {
  job_id: string;
  status: "pending" | "running" | "completed" | "failed";
  researchers_count: number;
  started_at: string | null;
  completed_at: string | null;
  result: Record<string, unknown> | null;
  error: string | null;
}

export interface CsvPreviewResponse {
  columns: string[];
  total_rows: number;
  sample_rows: Record<string, string>[];
  valid: boolean;
  missing_columns: string[];
}

export async function uploadCsv(
  file: File,
  limit?: number
): Promise<IngestionJobResponse> {
  const formData = new FormData();
  formData.append("file", file);

  let url = "/api/foundry/v1/ingest/upload";
  if (limit) url += `?limit=${limit}`;

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

export async function getIngestionStatus(
  jobId: string
): Promise<IngestionStatusResponse> {
  const res = await fetch(`/api/foundry/v1/ingest/status/${jobId}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail || res.statusText);
  }

  return res.json();
}
