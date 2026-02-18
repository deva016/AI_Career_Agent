"use client";

import { useState, useEffect, useCallback } from "react";

export interface LinkedInPost {
  id: string;
  content: string;
  status: "draft" | "scheduled" | "published";
  scheduled_at?: string;
  topic?: string;
  created_at: string;
}

export function useLinkedIn(status: string = "draft") {
  const [posts, setPosts] = useState<LinkedInPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/linkedin?status=${status}`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      setPosts(data.posts || data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const generatePost = async (topic: string, context?: string) => {
    const response = await fetch("/api/linkedin", {
      method: "POST",
      body: JSON.stringify({ topic, context }),
    });

    if (!response.ok) {
       const data = await response.json().catch(() => ({}));
       throw new Error(data.error || "Generation failed");
    }

    const result = await response.json();
    fetchPosts();
    return result;
  };

  return { posts, loading, error, refetch: fetchPosts, generatePost };
}
