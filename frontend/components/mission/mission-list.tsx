/**
 * Mission List Component
 * 
 * Grid of mission cards with filtering.
 */

"use client";

import { MissionResponse, MissionStatus } from "@/lib/types/agent";
import { MissionCard } from "./mission-card";
import { Loader2 } from "lucide-react";

interface MissionListProps {
  missions: MissionResponse[];
  loading?: boolean;
  onApprove?: (missionId: string) => void;
  onReject?: (missionId: string) => void;
  onViewDetails?: (missionId: string) => void;
}

export function MissionList({
  missions,
  loading,
  onApprove,
  onReject,
  onViewDetails,
}: MissionListProps) {
  if (loading) {
    return (
      <div role="status" className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 text-lg">No missions yet</p>
        <p className="text-slate-500 text-sm mt-2">
          Start a new mission from the dashboard
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {missions.map((mission) => (
        <MissionCard
          key={mission.mission_id}
          mission={mission}
          onApprove={() => onApprove?.(mission.mission_id)}
          onReject={() => onReject?.(mission.mission_id)}
          onViewDetails={() => onViewDetails?.(mission.mission_id)}
        />
      ))}
    </div>
  );
}
