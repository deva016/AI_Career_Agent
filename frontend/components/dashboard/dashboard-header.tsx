"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  badge?: {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  action?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
  };
  children?: ReactNode;
}

export function DashboardHeader({
  title,
  description,
  badge,
  action,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            {title}
          </h2>
          {badge && (
            <Badge variant={badge.variant || "outline"} className="gap-1.5 py-1 px-3 text-[10px] md:text-xs">
              {badge.label}
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-gray-400 mt-1 text-sm md:text-base">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
        {children}
        {action && (
          <Button onClick={action.onClick} className="w-full sm:w-auto h-9 md:h-10 text-xs md:text-sm">
            {action.icon && <action.icon className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />}
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
