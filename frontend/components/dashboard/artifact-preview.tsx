"use client";

import { Button } from "@/components/ui/button";
import {
  X,
  Copy,
  Printer,
  FileText,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useMemo } from "react";
import { type ArtifactItem } from "@/lib/hooks/use-artifacts";
import { JobSearchSummaryView } from "./job-search-summary-view";

interface ArtifactPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: ArtifactItem | null;
}

export function ArtifactPreview({ isOpen, onClose, artifact }: ArtifactPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!artifact?.content) return;
    try {
      await navigator.clipboard.writeText(artifact.content);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = artifact.content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [artifact?.content]);

  const handlePrint = useCallback(() => {
    if (!artifact?.content) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>${artifact.name}</title>
          <style>
            body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #333; }
            h1, h2, h3 { color: #1a1a1a; }
            pre { background: #f4f4f4; padding: 12px; border-radius: 4px; overflow-x: auto; }
            code { background: #f4f4f4; padding: 2px 4px; border-radius: 2px; }
          </style>
          </head>
          <body><pre style="white-space: pre-wrap; font-family: Georgia, serif;">${artifact.content}</pre></body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }, [artifact]);

  const dateStr = useMemo(() => {
    if (!artifact) return "";
    return new Date(artifact.created_at).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [artifact]);

  const contentPreview = useMemo(() => {
    if (!artifact) return null;
    if (!artifact.content) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center opacity-40">
          <FileText className="w-16 h-16 mb-4 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">
            Content not available for preview
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            This artifact may have been generated before content persistence was enabled.
          </p>
        </div>
      );
    }

    // Check if it's a JSON summary that needs rich rendering
    if (artifact.name === "job_search_summary") {
      try {
        let content = artifact.content;
        // Handle Python-style strings if JSON.parse fails
        try {
          return <JobSearchSummaryView data={JSON.parse(content)} />;
        } catch (e) {
          // Try to convert Python-style to JSON-style (basic)
          const jsonified = content
            .replace(/'/g, '"')
            .replace(/: None/g, ': null')
            .replace(/: True/g, ': true')
            .replace(/: False/g, ': false');
          return <JobSearchSummaryView data={JSON.parse(jsonified)} />;
        }
      } catch (e) {
        console.error("Failed to parse artifact content as JSON/Python-Dict:", e);
        // Fall back to pre
      }
    }

    return (
      <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300 leading-relaxed bg-white/5 rounded-2xl p-8 border border-white/10 shadow-2xl">
        {artifact.content}
      </pre>
    );
  }, [artifact]);

  if (!isOpen || !artifact) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col"
      >
        {/* Header */}
        <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-black/40 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{artifact.name}</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                {artifact.type.replace("_", " ")} • {dateStr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs bg-white/5 border-white/10 hover:bg-white/10"
              onClick={handleCopy}
            >
              {copied ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs bg-white/5 border-white/10 hover:bg-white/10"
              onClick={handlePrint}
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Export
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-white/10"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="max-w-3xl mx-auto">
            {contentPreview}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
