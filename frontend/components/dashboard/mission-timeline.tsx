"use client";

import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  PlayCircle,
  Info,
  FileText,
  Zap,
} from "lucide-react";

interface TimelineEvent {
  type: "log" | "artifact" | "hitl" | "error";
  message: string;
  timestamp?: string;
}

interface MissionTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const EVENT_CONFIG: Record<string, { icon: typeof Info; color: string }> = {
  log: { icon: Info, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  artifact: { icon: FileText, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  hitl: { icon: AlertTriangle, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  error: { icon: Zap, color: "text-red-400 bg-red-500/10 border-red-500/20" },
};

function formatEventTime(timestamp?: string): string {
  if (!timestamp) return "";
  try {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}

export function MissionTimeline({ events, className = "" }: MissionTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className={`flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10 ${className}`}>
        <Clock className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No events recorded yet</p>
      </div>
    );
  }

  return (
    <div className={`space-y-0 ${className}`}>
      {events.map((event, i) => {
        const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.log;
        const Icon = config.icon;
        const isLast = i === events.length - 1;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex gap-3"
          >
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className={`p-1.5 rounded-full border ${config.color}`}>
                <Icon className="w-3 h-3" />
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-white/10 my-1" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 flex-1 min-w-0">
              <p className="text-xs text-gray-300 leading-relaxed break-words">
                {event.message}
              </p>
              {event.timestamp && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {formatEventTime(event.timestamp)}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
