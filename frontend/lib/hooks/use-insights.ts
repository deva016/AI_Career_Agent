"use client";

import { useState, useEffect, useCallback } from "react";
import { agentClient } from "@/lib/api/agent-client";

export interface MarketTrend {
  month: string;
  demand: number;
}

export interface SkillGap {
  skill: string;
  match: number;
}

export interface InsightsData {
  skill_gaps: any;
  market_trend: MarketTrend[];
  top_gaps: SkillGap[];
  stats?: {
    total_applications: number;
    total_jobs_found: number;
    avg_match_score: number;
    market_match: string;
    skill_velocity: string;
    role_ranking: string;
  };
}

export function useInsights() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/insights");
      if (!response.ok) throw new Error("Failed to fetch insights");
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return { data, loading, error, refetch: fetchInsights };
}
