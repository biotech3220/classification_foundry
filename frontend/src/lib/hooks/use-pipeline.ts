"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  cancelPipeline,
  getPipelineStatus,
  runPipeline,
  runPipelineWithUpload,
  type PipelineRunResponse,
  type PipelineStatusResponse,
} from "@/lib/api/pipeline";

export function usePipelineRunner() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<PipelineStatusResponse | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async (id: string) => {
    try {
      const s = await getPipelineStatus(id);
      setStatus(s);
      if (s.status === "completed" || s.status === "failed") {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch {
      // Retry silently on network errors
    }
  }, []);

  const startPolling = useCallback(
    (id: string) => {
      setJobId(id);
      // Initial poll immediately
      poll(id);
      // Then poll every 2 seconds
      intervalRef.current = setInterval(() => poll(id), 2000);
    },
    [poll]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const runWithUpload = useCallback(
    async (file: File, stages: string[], limit?: number) => {
      setIsStarting(true);
      setError(null);
      setStatus(null);
      try {
        const resp = await runPipelineWithUpload(file, stages, limit);
        startPolling(resp.job_id);
        return resp;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to start pipeline";
        setError(msg);
        throw err;
      } finally {
        setIsStarting(false);
      }
    },
    [startPolling]
  );

  const runStages = useCallback(
    async (stages: string[], options?: { limit?: number; asset_ids?: string[] }) => {
      setIsStarting(true);
      setError(null);
      setStatus(null);
      try {
        const resp = await runPipeline(stages, options);
        startPolling(resp.job_id);
        return resp;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to start pipeline";
        setError(msg);
        throw err;
      } finally {
        setIsStarting(false);
      }
    },
    [startPolling]
  );

  const cancel = useCallback(async () => {
    if (!jobId) return;
    try {
      await cancelPipeline(jobId);
    } catch {
      // Ignore — job may already be done
    }
  }, [jobId]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setJobId(null);
    setStatus(null);
    setError(null);
    setIsStarting(false);
  }, []);

  return {
    jobId,
    status,
    isStarting,
    error,
    runWithUpload,
    runStages,
    cancel,
    reset,
    isRunning: status?.status === "running" || status?.status === "pending",
    isComplete: status?.status === "completed",
    isFailed: status?.status === "failed" || status?.status === "cancelled",
  };
}
