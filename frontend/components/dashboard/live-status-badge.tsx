"use client";

import { motion } from "framer-motion";

interface LiveStatusBadgeProps {
  status: "executing" | "needs_review" | "thinking" | "completed" | "failed";
  size?: "sm" | "md";
}

const STATUS_CONFIG = {
  thinking: {
    label: "Thinking",
    color: "bg-yellow-500",
    glow: "shadow-yellow-500/50",
    pulse: true,
  },
  executing: {
    label: "Running",
    color: "bg-blue-500",
    glow: "shadow-blue-500/50",
    pulse: true,
  },
  needs_review: {
    label: "Needs Review",
    color: "bg-orange-500",
    glow: "shadow-orange-500/50",
    pulse: true,
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-500",
    glow: "shadow-emerald-500/30",
    pulse: false,
  },
  failed: {
    label: "Failed",
    color: "bg-red-500",
    glow: "shadow-red-500/30",
    pulse: false,
  },
};

export function LiveStatusBadge({ status, size = "sm" }: LiveStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.thinking;
  const dotSize = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex">
        {config.pulse && (
          <motion.span
            className={`absolute inline-flex h-full w-full rounded-full ${config.color} opacity-50`}
            animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <span
          className={`relative inline-flex rounded-full ${dotSize} ${config.color} ${config.glow} shadow-lg`}
        />
      </span>
      <span className={`${textSize} font-medium text-muted-foreground uppercase tracking-wider`}>
        {config.label}
      </span>
    </div>
  );
}
