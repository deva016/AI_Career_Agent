"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  RefreshCw,
  PenSquare,
  Eye,
  FileText,
  Loader2,
  PlayCircle,
  AlertTriangle,
  LucideIcon,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { MissionTimeline } from "./mission-timeline";
import { LiveStatusBadge } from "./live-status-badge";

interface MissionEvent {
  type: "log" | "artifact" | "hitl" | "error";
  message: string;
  timestamp?: string;
}

interface Mission {
  id: string;
  agent: string;
  icon: LucideIcon;
  status: "executing" | "needs_review" | "thinking" | "completed";
  statusLabel: string;
  progress: number;
  timestamp: string;
  artifact?: string;
  events?: MissionEvent[];
}

interface StatusBadgeProps {
  status: Mission["status"];
  label: string;
}

function StatusBadge({ status, label }: StatusBadgeProps) {
  const variants = {
    thinking: "secondary" as const,
    executing: "default" as const,
    needs_review: "destructive" as const,
    completed: "outline" as const,
  };

  const icons = {
    thinking: Loader2,
    executing: PlayCircle,
    needs_review: AlertTriangle,
    completed: CheckCircle2,
  };

  const Icon = icons[status] || Loader2;

  return (
    <Badge
      variant={variants[status] || "outline"}
      className={`gap-1.5 px-2.5 py-1 ${
        status === "completed" ? "text-white border-white/20" : ""
      }`}
    >
      <Icon
        className={`w-3.5 h-3.5 ${
          status === "thinking" || status === "executing" ? "animate-spin" : ""
        }`}
      />
      {label}
    </Badge>
  );
}

interface MissionCardProps {
  mission: Mission;
  onApprove?: (id: string) => void;
  onRegenerate?: (id: string) => void;
  onEdit?: (id: string) => void;
  onViewArtifact?: (id: string) => void;
}

export function MissionCard({
  mission,
  onApprove,
  onRegenerate,
  onEdit,
  onViewArtifact,
}: MissionCardProps) {
  const Icon = mission.icon;
  const [showTimeline, setShowTimeline] = useState(false);
  const isActive = mission.status === "executing" || mission.status === "thinking" || mission.status === "needs_review";
  const hasEvents = mission.events && mission.events.length > 0;

  return (
    <Card className="group hover:bg-white/10 transition-all duration-300 cursor-pointer border-white/10 bg-white/5 backdrop-blur-md hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="p-2 md:p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-white/5 group-hover:scale-110 transition-transform">
              <Icon className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white tracking-tight text-sm md:text-base">
                {mission.agent}
              </h3>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider opacity-70">
                {mission.timestamp}
              </p>
            </div>
          </div>
          {isActive ? (
            <LiveStatusBadge status={mission.status} />
          ) : (
            <StatusBadge status={mission.status} label={mission.statusLabel} />
          )}
        </div>

        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{mission.progress}%</span>
          </div>
          <Progress value={mission.progress} className="h-1 md:h-1.5" />
        </div>

        {mission.status === "needs_review" && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Button
              size="sm"
              className="h-8 md:h-9 gap-1.5 px-3 md:px-4 text-[11px] md:text-xs flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white border-0"
              onClick={() => onApprove?.(mission.id)}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Quick Approve
            </Button>
            <Button
              size="sm"
              variant="default"
              className="h-8 md:h-9 gap-1.5 px-3 md:px-4 text-[11px] md:text-xs flex-1 sm:flex-none bg-purple-600 hover:bg-purple-500 text-white border-0"
              onClick={() => onViewArtifact?.(mission.id)}
            >
              <FileText className="w-3.5 h-3.5" />
              Review & Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 md:h-9 gap-1.5 px-3 md:px-4 text-[11px] md:text-xs flex-1 sm:flex-none bg-white/5 border-white/10 hover:bg-white/10"
              onClick={() => onRegenerate?.(mission.id)}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </Button>
          </div>
        )}

        {mission.artifact && (
          <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5 hover:bg-black/30 transition-colors group/artifact">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded bg-blue-500/10 text-blue-400">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-medium text-gray-300 group-hover/artifact:text-white transition-colors">
                {mission.artifact}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-white/10 hover:text-white"
              onClick={() => onViewArtifact?.(mission.id)}
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* Timeline toggle */}
        {hasEvents && (
          <div className="mt-4">
            <Button
              size="sm"
              variant="ghost"
              className="w-full h-8 text-[11px] text-muted-foreground hover:text-white gap-1.5"
              onClick={() => setShowTimeline(!showTimeline)}
            >
              <Clock className="w-3.5 h-3.5" />
              {showTimeline ? "Hide" : "Show"} Timeline ({mission.events!.length} events)
              {showTimeline ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
            {showTimeline && (
              <div className="mt-3 max-h-64 overflow-y-auto pr-2">
                <MissionTimeline events={mission.events!} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

