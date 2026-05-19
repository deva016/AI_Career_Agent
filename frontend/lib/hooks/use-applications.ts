import { useState, useEffect, useCallback } from "react";
import { agentClient } from "@/lib/api/agent-client";

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
  const [total, setTotal] = useState(0);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/applications?${new URLSearchParams({
        ...(filters.status && filters.status !== "all" && { status: filters.status }),
        ...(filters.limit && { limit: filters.limit.toString() }),
        ...(filters.offset && { offset: filters.offset.toString() }),
      }).toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }
      
      const data = await response.json();
      if (Array.isArray(data)) {
         setApplications(data);
         setTotal(data.length);
      } else {
         setApplications(data.applications || []);
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
    fetchApplications();
  }, [fetchApplications]);

  return { applications, total, loading, error, refetch: fetchApplications };
}

export function useUpdateApplicationStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(async (applicationId: string, status: string, notes?: string) => {
    setLoading(true);
    setError(null);
    try {
      await agentClient.updateApplicationStatus(applicationId, status, notes);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update application status";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateStatus, loading, error };
}
