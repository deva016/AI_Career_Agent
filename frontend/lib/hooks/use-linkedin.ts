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

export function useLinkedIn({ status = "all", limit = 10, offset = 0 }: { status?: string, limit?: number, offset?: number } = {}) {
  const [posts, setPosts] = useState<LinkedInPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/linkedin?status=${status}&limit=${limit}&offset=${offset}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      setPosts(data.posts || []);
      setTotal(data.total || 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [status, limit, offset]);

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

  const publishPost = async (postId: string, content: string, scheduledAt?: Date) => {
    const response = await fetch("/api/linkedin/publish", {
      method: "POST",
      body: JSON.stringify({ post_id: postId, content, scheduled_for: scheduledAt?.toISOString() }),
    });

    if (!response.ok) {
       const data = await response.json().catch(() => ({}));
       throw new Error(data.error || "Publish failed");
    }

    const result = await response.json();
    fetchPosts();
    return result;
  };

  return { posts, total, loading, error, refetch: fetchPosts, generatePost, publishPost };
}
