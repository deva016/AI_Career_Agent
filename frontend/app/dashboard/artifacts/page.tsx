"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Mail,
  BarChart2,
  FolderOpen,
  Filter,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardHeader, EmptyState, PageSkeleton } from "@/components/dashboard";
import { ArtifactCard } from "@/components/dashboard/artifact-card";
import { ArtifactPreview } from "@/components/dashboard/artifact-preview";
import { useArtifacts, type ArtifactItem } from "@/lib/hooks/use-artifacts";
import { toast } from "sonner";

const TYPE_TABS = [
  { key: "all", label: "All", icon: FolderOpen },
  { key: "resume", label: "Resumes", icon: FileText },
  { key: "cover_letter", label: "Cover Letters", icon: Mail },
  { key: "report", label: "Reports", icon: BarChart2 },
];

export default function ArtifactsPage() {
  const [activeType, setActiveType] = useState("all");
  const [previewArtifact, setPreviewArtifact] = useState<ArtifactItem | null>(null);

  const { artifacts, loading, error, refetch, deleteArtifact } = useArtifacts(
    activeType === "all" ? undefined : { type: activeType }
  );

  const handleDelete = async (id: string) => {
    const success = await deleteArtifact(id);
    if (success) {
      toast.success("Artifact deleted");
      if (previewArtifact?.id === id) setPreviewArtifact(null);
    } else {
      toast.error("Failed to delete artifact");
    }
  };

  if (loading && artifacts.length === 0) {
    return <PageSkeleton />;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
      >
        <DashboardHeader
          title="Documents"
          description="Browse all AI-generated resumes, cover letters, and reports"
        >
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
            {TYPE_TABS.map((tab) => (
              <Button
                key={tab.key}
                variant={activeType === tab.key ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs px-3 gap-1.5"
                onClick={() => setActiveType(tab.key)}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </Button>
            ))}
          </div>
        </DashboardHeader>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {artifacts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {artifacts.map((artifact, i) => (
              <motion.div
                key={artifact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ArtifactCard
                  artifact={artifact}
                  onPreview={setPreviewArtifact}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Target}
            title={activeType === "all" ? "No documents yet" : `No ${activeType.replace("_", " ")}s found`}
            description="Documents are generated when you complete missions like Resume Tailoring or Skill Gap Analysis. Launch a mission to get started!"
          />
        )}
      </motion.div>

      <ArtifactPreview
        isOpen={!!previewArtifact}
        onClose={() => setPreviewArtifact(null)}
        artifact={previewArtifact}
      />
    </>
  );
}
