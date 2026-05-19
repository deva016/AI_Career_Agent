/**
 * Agent Service API Client
 * 
 * Utility class for communicating with the Python AI Agent Service.
 */

import {
  MissionResponse,
  MissionsListResponse,
  MissionsFilter,
  JobFinderRequest,
  ResumeTailorRequest,
  ApplicationRequest,
  LinkedInRequest,
  SkillGapRequest,
  InterviewRequest,
  ApprovalRequest,
  UserSettings,
  UserSettingsUpdate,
} from "@/lib/types/agent";

const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || "http://localhost:8000";

export class AgentClientError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = "AgentClientError";
  }
}

export class AgentClient {
  private baseUrl: string;

  constructor(baseUrl: string = "/api/agent") {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AgentClientError(
          errorData.detail || `Request failed: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof AgentClientError) {
        throw error;
      }
      throw new AgentClientError(
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  // Job Finder Agent
  async startJobFinder(params: JobFinderRequest): Promise<MissionResponse> {
    return this.request<MissionResponse>("/mission/job-finder", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  // Resume Agent
  async startResumeMission(params: ResumeTailorRequest): Promise<MissionResponse> {
    return this.request<MissionResponse>("/mission/resume", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  // Application Agent
  async startApplicationMission(params: ApplicationRequest): Promise<MissionResponse> {
    return this.request<MissionResponse>("/mission/application", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  // LinkedIn Agent
  async startLinkedInMission(params: LinkedInRequest): Promise<MissionResponse> {
    return this.request<MissionResponse>("/mission/linkedin", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  // Skill Gap Agent
  async startSkillGapMission(params: SkillGapRequest): Promise<MissionResponse> {
    return this.request<MissionResponse>("/mission/skill-gap", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  // Interview Preparation Agent
  async startInterviewMission(params: InterviewRequest): Promise<MissionResponse> {
    return this.request<MissionResponse>("/mission/interview", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  // Get mission status
  async getMission(missionId: string): Promise<MissionResponse> {
    return this.request<MissionResponse>(`/mission/${missionId}`);
  }

  // Approve/reject mission (HITL)
  async approveMission(
    missionId: string,
    approval: ApprovalRequest
  ): Promise<MissionResponse> {
    return this.request<MissionResponse>(`/mission/${missionId}/approve`, {
      method: "POST",
      body: JSON.stringify(approval),
    });
  }

  // List missions
  async listMissions(filters?: MissionsFilter): Promise<MissionsListResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());

    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<MissionsListResponse>(`/missions${query}`);
  }

  // Job Status
  async updateJobStatus(jobId: string, status: string): Promise<any> {
    return this.request(`/jobs/${jobId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  // User Settings
  async getSettings(): Promise<UserSettings> {
    return this.request<UserSettings>("/settings");
  }

  async updateSettings(payload: UserSettingsUpdate): Promise<any> {
    return this.request("/settings", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  // Application Status
  async updateApplicationStatus(applicationId: string, status: string, notes?: string): Promise<any> {
    return this.request(`/applications/${applicationId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    });
  }

  async publishLinkedInPost(postId: string, content: string, scheduledFor?: Date): Promise<any> {
    return this.request("/linkedin/publish", {
      method: "POST",
      body: JSON.stringify({
        post_id: postId,
        content,
        scheduled_for: scheduledFor?.toISOString(),
      }),
    });
  }

  // Create EventSource for SSE streaming
  createEventStream(onMessage: (data: any) => void, onError?: (error: Event) => void): EventSource {
    const eventSource = new EventSource(`${this.baseUrl}/events`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error("Failed to parse SSE event:", error);
      }
    };

    if (onError) {
      eventSource.onerror = onError;
    }

    return eventSource;
  }
}

// Singleton instance
export const agentClient = new AgentClient();
