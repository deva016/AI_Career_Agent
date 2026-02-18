/**
 * Agent Service API Types
 * 
 * TypeScript definitions for interacting with the Python AI Agent Service.
 */

export enum MissionStatus {
  PENDING = "pending",
  RUNNING = "running",
  EXECUTING = "executing",
  WAITING_APPROVAL = "waiting_approval",
  APPROVED = "approved",
  REJECTED = "rejected",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum AgentType {
  JOB_FINDER = "job_finder",
  RESUME = "resume",
  APPLICATION = "application",
  LINKEDIN = "linkedin",
  SKILL_GAP = "skill_gap",
  INTERVIEW = "interview",
}

export interface MissionEvent {
  type: "log" | "artifact" | "hitl" | "error";
  message: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface MissionArtifact {
  type: "resume" | "cover_letter" | "linkedin_post" | "report";
  title: string;
  content: string;
  format?: string;
  metadata?: Record<string, any>;
}

export interface MissionResponse {
  mission_id: string;
  status: MissionStatus;
  progress: number;
  current_node: string;
  events: MissionEvent[];
  artifacts: MissionArtifact[];
  output_data?: Record<string, any>;
  requires_approval: boolean;
  approval_reason?: string;
}

// Request types for each agent
export interface JobFinderRequest {
  query?: string;
  target_roles?: string[];
  target_locations?: string[];
}

export interface ResumeTailorRequest {
  job_id?: string;
  job_description?: string;
  job_title?: string;
  company?: string;
  location?: string;
}

export interface ApplicationRequest {
  job_id?: string;
  url?: string;
  resume_id?: string;
}

export interface LinkedInRequest {
  topic?: string;
  context?: string;
}

export interface SkillGapRequest {
  role?: string;
}

export interface InterviewRequest {
  company?: string;
  role?: string;
  job_id?: string;
}

export interface ApprovalRequest {
  approved: boolean;
  feedback?: string;
}

export interface MissionsListResponse {
  missions: MissionResponse[];
  total: number;
}

export interface MissionsFilter {
  status?: MissionStatus;
  limit?: number;
  offset?: number;
}
