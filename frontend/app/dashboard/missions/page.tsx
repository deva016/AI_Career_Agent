"use client";

import { useState } from "react";
import {
  Target, Plus, Filter, Bot, FileText, Send,
  Linkedin, TrendingUp, Mic,
} from "lucide-react";

// Agent type display config
const AGENT_CONFIG: Record<string, { label: string; icon: any }> = {
  job_finder: { label: "Job Finder", icon: Target },
  resume: { label: "Resume Agent", icon: FileText },
  application: { label: "Application Agent", icon: Send },
  linkedin: { label: "LinkedIn Agent", icon: Linkedin },
  skill_gap: { label: "Skill Gap Analysis", icon: TrendingUp },
  interview: { label: "Interview Prep", icon: Mic },
};

function formatTimeAgo(isoString?: string): string {
  if (!isoString) return "Recent";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { agentClient } from "@/lib/api/agent-client";
import {
  DashboardHeader,
  MissionCard,
  EmptyState,
  PageSkeleton,
  LaunchMissionModal,
} from "@/components/dashboard";
import { useMissions, useApproveMission } from "@/lib/hooks/use-missions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReviewWorkbench } from "@/components/dashboard/review-workbench";

// Map backend status to frontend status
function mapMissionStatus(backendStatus: string): "executing" | "needs_review" | "thinking" | "completed" {
  const statusMap: Record<string, "executing" | "needs_review" | "thinking" | "completed"> = {
    running: "executing",
    executing: "executing",
    pending: "thinking",
    waiting_approval: "needs_review",
    completed: "completed",
    failed: "completed",
  };
  return statusMap[backendStatus] || "thinking";
}

export default function MissionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { missions, loading, error, refetch } = useMissions();
  const { approve } = useApproveMission();
  const { toast } = useToast();
  const [launching, setLaunching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewMission, setReviewMission] = useState<any>(null);

  const handleLaunchJobFinder = async (params: { query: string; target_roles: string[]; target_locations: string[] }) => {
    setLaunching(true);
    try {
      await agentClient.startJobFinder(params);
      
      toast({
        title: "Mission Launched! 🚀",
        description: `Started searching for ${params.query} roles.`,
      });
      
      setIsModalOpen(false);
      setTimeout(refetch, 1000);
    } catch (err) {
      toast({
        title: "Launch Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLaunching(false);
    }
  };

  const handleApprove = async (id: string, feedback?: string, edited_content?: string) => {
    const mission = missions.find(m => m.mission_id === id);
    if (!feedback && !edited_content && mission && mission.status === "waiting_approval" && !reviewMission) {
      setReviewMission(mission);
      return;
    }

    const result = await approve(id, true, feedback, edited_content);
    if (result.success) {
      setReviewMission(null);
      setTimeout(refetch, 500);
    }
  };

  const handleRegenerate = async (id: string, feedback?: string) => {
    const result = await approve(id, false, feedback || "Please regenerate");
    if (result.success) {
      setReviewMission(null);
      setTimeout(refetch, 500);
    }
  };

  const handleEdit = (id: string) => {
    const mission = missions.find(m => m.mission_id === id);
    if (mission) {
      setReviewMission(mission);
    }
  };

  const filteredMissions = missions.filter((m) => {
    if (statusFilter === "all") return true;
    return m.status === statusFilter;
  });

  if (loading && missions.length === 0) {
    return <PageSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <DashboardHeader
        title="Mission Control"
        description="Monitor and command your autonomous agent fleet"
        action={{
          label: "Launch Search",
          icon: Plus,
          onClick: () => setIsModalOpen(true),
        }}
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="waiting_approval">Needs Approval</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </DashboardHeader>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-red-400 font-medium">System Error: {error}</p>
        </div>
      )}

      {filteredMissions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
          {filteredMissions.map((mission, idx) => {
            const config = AGENT_CONFIG[mission.agent_type || ""] || { label: mission.current_node || "Agent", icon: Bot };
            return (
            <motion.div
              key={mission.mission_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <MissionCard
                mission={{
                  id: mission.mission_id,
                  agent: config.label,
                  icon: config.icon,
                  status: mapMissionStatus(mission.status.toString()),
                  statusLabel: mission.status.replace("_", " "),
                  progress: mission.progress || 0,
                  timestamp: formatTimeAgo(mission.created_at),
                  artifact: mission.artifacts?.[0]?.title,
                }}
                onApprove={handleApprove}
                onRegenerate={handleRegenerate}
                onEdit={handleEdit}
                onViewArtifact={(id) => {
                   const m = missions.find(x => x.mission_id === id);
                   if (m) setReviewMission(m);
                }}
              />
            </motion.div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title={statusFilter === "all" ? "No missions yet" : `No ${statusFilter} missions`}
          description="Initialize your first career agent mission to see them in control here."
          action={{
            label: "Launch First Mission",
            icon: Plus,
            onClick: () => setIsModalOpen(true),
          }}
        />
      )}

      <LaunchMissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLaunch={handleLaunchJobFinder}
        isLaunching={launching}
      />

      {reviewMission && (
        <ReviewWorkbench
          isOpen={!!reviewMission}
          onClose={() => {
            setReviewMission(null);
            refetch();
          }}
          missionId={reviewMission.mission_id}
          agent={AGENT_CONFIG[reviewMission.agent_type || ""]?.label || "Agent"}
          oldContent={reviewMission.input_data?.job_description || "Base Profile Content"}
          newContent={reviewMission.artifacts?.[0]?.content || reviewMission.output_data?.content || "AI Generated Content"}
          reasoning={reviewMission.output_data?.reasoning || []}
          onApprove={handleApprove}
          onRegenerate={handleRegenerate}
          onManualEdit={(id, content) => {
            console.log("Manual edit on", id, content);
          }}
        />
      )}
    </motion.div>
  );
}
