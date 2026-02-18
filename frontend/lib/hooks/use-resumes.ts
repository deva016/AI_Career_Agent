"use client";

import { useState, useEffect, useCallback } from "react";

export interface Resume {
  id: string;
  filename: string;
  original_content?: string;
  tailored_content?: string;
  job_id?: string;
  status: string;
  created_at: string;
}

export function useResumes(jobId?: string) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (jobId) queryParams.append("job_id", jobId);

      const response = await fetch(`/api/resumes?${queryParams.toString()}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch resumes");
      }
      
      const data = await response.json();
      setResumes(Array.isArray(data) ? data : data.resumes || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const uploadResume = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/resumes", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
       const data = await response.json().catch(() => ({}));
       throw new Error(data.error || "Upload failed");
    }

    const result = await response.json();
    fetchResumes();
    return result;
  };

  return { resumes, loading, error, refetch: fetchResumes, uploadResume };
}
