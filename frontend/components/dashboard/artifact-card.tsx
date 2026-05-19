"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Mail,
  BarChart2,
  Briefcase,
  Share2,
  Brain,
  Eye,
  Trash2,
  Clock,
  Search,
  Database,
} from "lucide-react";
import { type ArtifactItem } from "@/lib/hooks/use-artifacts";

interface ArtifactCardProps {
  artifact: ArtifactItem;
  onPreview: (artifact: ArtifactItem) => void;
  onDelete?: (id: string) => void;
}

const TYPE_CONFIG: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  resume: { icon: FileText, label: "Resume", color: "text-blue-400 bg-blue-500/10" },
  cover_letter: { icon: Mail, label: "Cover Letter", color: "text-emerald-400 bg-emerald-500/10" },
  report: { icon: BarChart2, label: "Report", color: "text-amber-400 bg-amber-500/10" },
  job_summary: { icon: Briefcase, label: "Job Summary", color: "text-purple-400 bg-purple-500/10" },
  linkedin_post: { icon: Share2, label: "LinkedIn Post", color: "text-cyan-400 bg-cyan-500/10" },
  interview_guide: { icon: Brain, label: "Interview Guide", color: "text-pink-400 bg-pink-500/10" },
  skill_gap_report: { icon: BarChart2, label: "Skill Analysis", color: "text-orange-400 bg-orange-500/10" },
  json: { icon: Search, label: "Search Summary", color: "text-primary bg-primary/10" },
};

function getTypeConfig(type: string) {
  // Normalize: "resume_pdf" → "resume", etc.
  const normalized = type.replace(/_pdf$/, "").replace(/^text_/, "");
  return TYPE_CONFIG[normalized] || { icon: FileText, label: type, color: "text-gray-400 bg-gray-500/10" };
}

export function ArtifactCard({ artifact, onPreview, onDelete }: ArtifactCardProps) {
  const config = getTypeConfig(artifact.type);
  const Icon = config.icon;
  const dateStr = new Date(artifact.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="group hover:bg-white/10 transition-all duration-300 border-white/10 bg-white/5 backdrop-blur-md hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${config.color} border border-white/5`}>
            <Icon className="w-5 h-5" />
          </div>
          <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
            {config.label}
          </Badge>
        </div>

        <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2 leading-snug">
          {artifact.name}
        </h3>

        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-4">
          <Clock className="w-3 h-3" />
          <span>{dateStr}</span>
        </div>

        {artifact.content && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed italic">
            {artifact.type === "json" || artifact.name.includes("summary") 
              ? "Mission summary and results available in rich preview."
              : artifact.content.substring(0, 120) + "..."
            }
          </p>
        )}

        <div className="flex items-center gap-2 mt-auto">
          <Button
            size="sm"
            className="h-8 gap-1.5 px-3 text-[11px] flex-1"
            onClick={() => onPreview(artifact)}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </Button>
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-400"
              onClick={() => onDelete(artifact.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
