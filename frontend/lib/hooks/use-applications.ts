"use client";

import { useState, useEffect, useCallback } from "react";

export interface Application {
  id: string;
  job_id: string;
  user_id: string;
  status: "pending" | "submitted" | "interviewing" | "offered" | "rejected";
  applied_at: string;
  notes?: string;
  job_title?: string;
  job_company?: string;
  job_url?: string;
  created_at: string;
  updated_at: string;
}

export function useApplications(filters: { status?: string; limit?: number; offset?: number } = {}) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.status && filters.status !== "all") queryParams.append("status", filters.status);
      if (filters.limit) queryParams.append("limit", filters.limit.toString());
      if (filters.offset) queryParams.append("offset", filters.offset.toString());

      const response = await fetch(`/api/applications?${queryParams.toString()}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch applications");
      }
      
      const data = await response.json();
      setApplications(Array.isArray(data) ? data : data.applications || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return { applications, loading, error, refetch: fetchApplications };
}
