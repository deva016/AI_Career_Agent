"use client";

import { useState, useEffect, useCallback } from "react";

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

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.status && filters.status !== "all") queryParams.append("status", filters.status);
      if (filters.limit) queryParams.append("limit", filters.limit.toString());
      if (filters.offset) queryParams.append("offset", filters.offset.toString());

      const response = await fetch(`/api/jobs?${queryParams.toString()}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch jobs");
      }
      
      const data = await response.json();
      setJobs(Array.isArray(data) ? data : data.jobs || []);
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

  return { jobs, loading, error, refetch: fetchJobs };
}
