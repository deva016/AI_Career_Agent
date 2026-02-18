"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  Clock,
  Bot,
  Zap,
  Target,
  ChevronRight,
  FileText,
  Send,
  Linkedin,
  TrendingUp,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MissionCard,
  DashboardHeader,
  EmptyState,
  PageSkeleton,
  KPIStrip,
} from "@/components/dashboard";
import { useMissions, useApproveMission } from "@/lib/hooks/use-missions";
import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats";

// Agent type display config
const AGENT_CONFIG: Record<string, { label: string; icon: any }> = {
  job_finder: { label: "Job Finder", icon: Target },
  resume: { label: "Resume Agent", icon: FileText },
  application: { label: "Application Agent", icon: Send },
  linkedin: { label: "LinkedIn Agent", icon: Linkedin },
  skill_gap: { label: "Skill Gap Analysis", icon: TrendingUp },
  interview: { label: "Interview Prep", icon: Mic },
};

// Map backend status to frontend status
function mapMissionStatus(backendStatus: string): "executing" | "needs_review" | "thinking" | "completed" {
  const statusMap: Record<string, "executing" | "needs_review" | "thinking" | "completed"> = {
    "running": "executing",
    "executing": "executing",
    "pending": "thinking",
    "waiting_approval": "needs_review",
    "completed": "completed",
    "failed": "completed",
  };
  return statusMap[backendStatus] || "thinking";
}

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

export default function DashboardPage() {
  const { missions, loading, error, refetch } = useMissions({ limit: 10 });
  const { approve } = useApproveMission();
  const { stats } = useDashboardStats();

  const handleApprove = async (id: string) => {
    const result = await approve(id, true);
    if (result.success) {
      refetch();
    }
  };

  const handleRegenerate = async (id: string) => {
    const result = await approve(id, false, "Please regenerate");
    if (result.success) {
      refetch();
    }
  };

  if (loading && missions.length === 0) {
    return <PageSkeleton />;
  }

  const activeMissions = missions.filter((m) => 
    m.status === "running" || m.status === "pending" || m.status === "waiting_approval"
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* KPI Section */}
      <KPIStrip />

      {/* Mission Log Header */}
      <DashboardHeader
        title="Mission Control"
        description="Real-time monitoring of your autonomous career agents"
        badge={{
          label: "Active Operations",
          variant: "outline",
        }}
        action={{
          label: "New Mission",
          icon: Zap,
          onClick: () => {
            window.location.href = "/dashboard/missions";
          },
        }}
      />

      {/* Error State */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/20 mb-6">
          <CardContent className="p-4">
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Mission Cards Grid */}
      {activeMissions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeMissions.map((mission) => {
            const config = AGENT_CONFIG[mission.agent_type || ""] || { label: mission.current_node || "Agent", icon: Bot };
            return (
              <MissionCard
                key={mission.mission_id}
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
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="No active missions"
          description="Start a new mission to begin your automated career growth"
          action={{
            label: "Start Agent",
            icon: Zap,
            onClick: () => {
              window.location.href = "/dashboard/missions";
            },
          }}
        />
      )}

      {/* Smart Suggestions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-transparent border-primary/20 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 flex items-center justify-between relative z-10 flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20 group-hover:bg-primary/30 transition-colors">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">
                  {stats && stats.jobs_found > 0
                    ? `Profile Match: ${stats.jobs_found} Jobs Discovered`
                    : "Ready to Launch"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {stats && stats.jobs_found > 0
                    ? `Your agents have found ${stats.jobs_found} opportunities. ${stats.applications_sent} applications sent.`
                    : "Launch your first Job Finder mission to start discovering opportunities."}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="gap-2 group-hover:bg-white group-hover:text-black transition-colors"
              onClick={() => {
                window.location.href = stats && stats.jobs_found > 0 ? "/dashboard/jobs" : "/dashboard/missions";
              }}
            >
              {stats && stats.jobs_found > 0 ? "Review Matches" : "Get Started"}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
