/**
 * Mission Card Component
 * 
 * Displays a single mission with status, progress, and actions.
 */

"use client";

import { MissionResponse, MissionStatus, AgentType } from "@/lib/types/agent";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Clock, Loader2, FileText } from "lucide-react";

interface MissionCardProps {
  mission: MissionResponse;
  onApprove?: () => void;
  onReject?: () => void;
  onViewDetails?: () => void;
}

export function MissionCard({ mission, onApprove, onReject, onViewDetails }: MissionCardProps) {
  const statusConfig = getStatusConfig(mission.status);
  const agentLabel = getAgentLabel(mission.mission_id.split("-")[0]);

  return (
    <Card className="w-full bg-slate-900/40 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {statusConfig.icon}
            {agentLabel}
          </CardTitle>
          <Badge variant={statusConfig.variant as any} className={statusConfig.className}>
            {statusConfig.label}
          </Badge>
        </div>
        <CardDescription className="text-slate-400">
          Mission ID: {mission.mission_id.slice(0, 8)}...
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Progress</span>
            <span className="text-slate-300 font-medium">{mission.progress}%</span>
          </div>
          <Progress value={mission.progress} className="h-2" aria-label="Mission progress" />
        </div>

        {/* Current Node */}
        <div className="text-sm">
          <span className="text-slate-400">Current Step: </span>
          <span className="text-slate-200 font-medium capitalize">
            {mission.current_node.replace(/[_-]/g, " ")}
          </span>
        </div>

        {/* Approval Notice */}
        {mission.requires_approval && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-yellow-400 text-sm font-medium">⏸️ Awaiting Your Approval</p>
            {mission.approval_reason && (
              <p className="text-yellow-300/70 text-xs mt-1">{mission.approval_reason}</p>
            )}
          </div>
        )}

        {/* Last Event */}
        {mission.events && mission.events.length > 0 && (
          <div className="text-sm">
            <span className="text-slate-400">Latest: </span>
            <span className="text-slate-300">
              {mission.events[mission.events.length - 1].message}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {mission.requires_approval ? (
          <>
            <Button
              size="sm"
              onClick={onApprove}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onReject}
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={onViewDetails}
            className="w-full border-slate-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            View Details
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function getStatusConfig(status: MissionStatus) {
  switch (status) {
    case MissionStatus.PENDING:
      return {
        icon: <Clock className="w-5 h-5 text-slate-400" />,
        label: "Pending",
        variant: "secondary",
        className: "bg-slate-700 text-slate-300",
      };
    case MissionStatus.RUNNING:
    case MissionStatus.EXECUTING:
      return {
        icon: <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />,
        label: "Running",
        variant: "default",
        className: "bg-blue-600/20 text-blue-300 border-blue-500/30",
      };
    case MissionStatus.WAITING_APPROVAL:
      return {
        icon: <Clock className="w-5 h-5 text-yellow-400" />,
        label: "Waiting Approval",
        variant: "secondary",
        className: "bg-yellow-600/20 text-yellow-300 border-yellow-500/30",
      };
    case MissionStatus.COMPLETED:
      return {
        icon: <CheckCircle className="w-5 h-5 text-green-400" />,
        label: "Completed",
        variant: "default",
        className: "bg-green-600/20 text-green-300 border-green-500/30",
      };
    case MissionStatus.FAILED:
      return {
        icon: <XCircle className="w-5 h-5 text-red-400" />,
        label: "Failed",
        variant: "destructive",
        className: "bg-red-600/20 text-red-300 border-red-500/30",
      };
    default:
      return {
        icon: <Clock className="w-5 h-5 text-slate-400" />,
        label: "Unknown",
        variant: "secondary",
        className: "bg-slate-700 text-slate-300",
      };
  }
}

function getAgentLabel(prefix: string): string {
  const labels: Record<string, string> = {
    job: "Job Finder",
    resume: "Resume Tailor",
    app: "Auto Application",
    linkedin: "LinkedIn Post",
    skill: "Skill Gap Analysis",
    interview: "Interview Prep",
  };
  return labels[prefix] || "Mission";
}
