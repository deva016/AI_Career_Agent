/**
 * React Hook for Artifact Management
 * 
 * Fetches artifacts from the backend with optional filtering by type.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

export interface ArtifactItem {
  id: string;
  user_id: string;
  type: string;
  file_url: string;
  name: string;
  content?: string | null;
  related_job_id?: string | null;
  mission_id?: string | null;
  created_at: string;
}

interface UseArtifactsOptions {
  type?: string;
  missionId?: string;
}

export function useArtifacts(options?: UseArtifactsOptions) {
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArtifacts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options?.type) params.append("type", options.type);
      if (options?.missionId) params.append("mission_id", options.missionId);

      const query = params.toString() ? `?${params.toString()}` : "";
      const response = await fetch(`/api/artifacts${query}`);

      if (!response.ok) {
        throw new Error("Failed to fetch artifacts");
      }

      const data = await response.json();
      setArtifacts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [options?.type, options?.missionId]);

  useEffect(() => {
    fetchArtifacts();
  }, [fetchArtifacts]);

  const deleteArtifact = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/artifacts/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete artifact");
      setArtifacts((prev) => prev.filter((a) => a.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    artifacts,
    loading,
    error,
    refetch: fetchArtifacts,
    deleteArtifact,
  };
}
