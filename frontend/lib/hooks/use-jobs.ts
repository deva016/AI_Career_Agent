import { useState, useEffect, useCallback } from "react";
import { agentClient } from "@/lib/api/agent-client";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary_range?: string;
  job_type?: string;
  status: "found" | "shortlisted" | "applied" | "rejected";
  match_score?: number;
  match_reasoning?: string;
  scraped_at: string;
  created_at: string;
}

export function useJobs(filters: { status?: string; limit?: number; offset?: number } = {}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      // Compatibility: agentClient.listJobs returns MissionsListResponse usually, 
      // but we need to fetch jobs specifically. Let's make sure it handles /api/jobs
      const response = await fetch(`/api/jobs?${new URLSearchParams({
        ...(filters.status && filters.status !== "all" && { status: filters.status }),
        ...(filters.limit && { limit: filters.limit.toString() }),
        ...(filters.offset && { offset: filters.offset.toString() }),
      }).toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      
      const data = await response.json();
      if (Array.isArray(data)) {
         setJobs(data);
         setTotal(data.length);
      } else {
         setJobs(data.jobs || []);
         setTotal(data.total || 0);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, total, loading, error, refetch: fetchJobs };
}

export function useUpdateJobStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(async (jobId: string, status: string) => {
    setLoading(true);
    setError(null);
    try {
      await agentClient.updateJobStatus(jobId, status);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update job status";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateStatus, loading, error };
}
