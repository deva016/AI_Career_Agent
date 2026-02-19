/**
 * React Hooks for Mission Management
 * 
 * Custom hooks for interacting with the AI Agent Service.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { agentClient } from "@/lib/api/agent-client";
import {
  MissionResponse,
  MissionsListResponse,
  MissionsFilter,
  MissionStatus,
} from "@/lib/types/agent";

/**
 * Hook to fetch and manage a list of missions
 */
export function useMissions(filters?: MissionsFilter) {
  const [missions, setMissions] = useState<MissionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchMissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await agentClient.listMissions(filters);
      setMissions(response.missions);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch missions");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  return {
    missions,
    total,
    loading,
    error,
    refetch: fetchMissions,
  };
}

/**
 * Hook to fetch and monitor a single mission with polling
 */
export function useMission(missionId: string | null, pollInterval = 2000) {
  const [mission, setMission] = useState<MissionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMission = useCallback(async () => {
    console.log('fetchMission called with:', missionId);
    if (!missionId) {
      console.log('Aborting fetchMission because no ID');
      setLoading(false);
      return;
    }

    try {
      const response = await agentClient.getMission(missionId);
      setMission(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch mission");
    } finally {
      setLoading(false);
    }
  }, [missionId]);

  useEffect(() => {
    fetchMission();
  }, [fetchMission]);

  useEffect(() => {
    if (mission && isActiveMission(mission.status)) {
      const interval = setInterval(fetchMission, pollInterval);
      return () => clearInterval(interval);
    }
  }, [mission, pollInterval, fetchMission]);

  return {
    mission,
    loading,
    error,
    refetch: fetchMission,
  };
}

/**
 * Hook for real-time mission updates via SSE
 */
export function useAgentStream() {
  const [updates, setUpdates] = useState<Record<string, any>>({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = agentClient.createEventStream(
        (data) => {
          // Update the specific mission in state
          setUpdates((prev) => ({
            ...prev,
            [data.mission_id]: data,
          }));
          setConnected(true);
          setError(null);
        },
        (err) => {
          console.error("SSE error:", err);
          setError("Connection lost");
          setConnected(false);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to stream");
    }

    return () => {
      eventSource?.close();
    };
  }, []);

  return {
    updates,
    connected,
    error,
  };
}

/**
 * Hook for triggering mission approvals (HITL)
 */
export function useApproveMission() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approve = useCallback(async (missionId: string, approved: boolean, feedback?: string, edited_content?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await agentClient.approveMission(missionId, {
        approved,
        feedback,
        edited_content,
      });
      return { success: true, data: response, error: null };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to approve mission";
      setError(errorMsg);
      return { success: false, data: null, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    approve,
    loading,
    error,
  };
}

// Helper function to check if a mission is still active
function isActiveMission(status: MissionStatus): boolean {
  return [
    MissionStatus.PENDING,
    MissionStatus.RUNNING,
    MissionStatus.EXECUTING,
    MissionStatus.WAITING_APPROVAL,
  ].includes(status);
}
