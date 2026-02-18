"use client";

import { useState } from "react";
import { Target, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  DashboardHeader,
  MissionCard,
  EmptyState,
  PageSkeleton,
} from "@/components/dashboard";
import { useMissions, useApproveMission } from "@/lib/hooks/use-missions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

// Map agent type to icon  
function getAgentIcon(agentType: string) {
  return Target; // Simplified for now
}

export default function MissionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { missions, loading, error, refetch } = useMissions();
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

  const filteredMissions = missions.filter((m) => {
    if (statusFilter === "all") return true;
    return m.status === statusFilter;
  });

  if (loading && missions.length === 0) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
          <PageSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <DashboardHeader
          title="All Missions"
          description="View and manage all agent missions"
          action={{
            label: "New Mission",
            icon: Plus,
            onClick: () => {
              // TODO: Open new mission dialog
              alert("New mission dialog coming soon!");
            },
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
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {filteredMissions.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredMissions.map((mission) => (
              <MissionCard
                key={mission.mission_id}
                mission={{
                  id: mission.mission_id,
                  agent: mission.current_node || "Agent",
                  icon: getAgentIcon(mission.current_node || ""),
                  status: mapMissionStatus(mission.status.toString()),
                  statusLabel: mission.status.replace("_", " "),
                  progress: mission.progress || 0,
                  timestamp: "Recent", // No created_at in MissionResponse
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
            title={statusFilter === "all" ? "No missions yet" : `No ${statusFilter} missions`}
            description="Start your first mission to see it appear here"
            action={{
              label: "Create Mission",
              icon: Plus,
              onClick: () => {
                alert("New mission dialog coming soon!");
              },
            }}
          />
        )}
      </main>
    </div>
  );
}
