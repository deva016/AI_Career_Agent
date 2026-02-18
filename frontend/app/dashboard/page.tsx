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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  KPICard,
  MissionCard,
  Sidebar,
  DashboardHeader,
  EmptyState,
  PageSkeleton,
} from "@/components/dashboard";
import { useMissions, useApproveMission } from "@/lib/hooks/use-missions";

const kpiData = [
  { label: "Applications", value: "24", icon: Briefcase, trend: "+5 this week" },
  { label: "Time Saved", value: "18h", icon: Clock, trend: "vs manual" },
  { label: "Active Agents", value: "3", icon: Bot, trend: "6 available" },
  { label: "Token Usage", value: "Free", icon: Zap, trend: "Gemini Flash" },
];

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

// Map agent type to icon
function getAgentIcon(agentType: string) {
  const iconMap: Record<string, any> = {
    "job_finder": Target,
    "resume_agent": FileText,
    "application_agent": Briefcase,
    "linkedin_agent": Target,
  };
  return iconMap[agentType] || Bot;
}

export default function DashboardPage() {
  const { missions, loading, error, refetch } = useMissions({ limit: 10 });
  const { approve } = useApproveMission();

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
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black text-foreground flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-4 md:p-8">
          <PageSkeleton />
        </main>
      </div>
    );
  }

  const activeMissions = missions.filter((m) => 
    m.status === "running" || m.status === "pending" || m.status === "waiting_approval"
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black text-foreground flex">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpiData.map((kpi, index) => (
            <KPICard key={kpi.label} {...kpi} index={index} />
          ))}
        </div>

        {/* Mission Log Header */}
        <DashboardHeader
          title="Mission Log"
          description="Active agent missions and tasks"
          badge={{
            label: "Gemini Flash (Free)",
            variant: "outline",
          }}
          action={{
            label: "New Mission",
            icon: Zap,
            onClick: () => {
              // Navigate to new mission
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {activeMissions.map((mission) => (
              <MissionCard
                key={mission.mission_id}
                mission={{
                  id: mission.mission_id,
                  agent: mission.current_node || "Agent",
                  icon: getAgentIcon(mission.current_node || ""),
                  status: mapMissionStatus(mission.status.toString()),
                  statusLabel: mission.status.replace("_", " "),
                  progress: mission.progress || 0,
                  timestamp: "Recent",
                  artifact: mission.artifacts?.[0]?.title,
                }}
                onApprove={handleApprove}
                onRegenerate={handleRegenerate}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Target}
            title="No active missions"
            description="Start a new mission to see agent activity here"
            action={{
              label: "Start Mission",
              icon: Zap,
              onClick: () => {
                window.location.href = "/dashboard/missions";
              },
            }}
          />
        )}

        {/* Suggestion Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-transparent border-primary/20 backdrop-blur-md relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 flex items-center justify-between relative z-10 flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white">
                    12 new jobs match your profile
                  </h3>
                  <p className="text-muted-foreground">
                    Start a scrape mission to find more opportunities
                  </p>
                </div>
              </div>
              <Button variant="secondary" className="gap-2">
                Start Mission
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
