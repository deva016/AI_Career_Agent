"use client";

import { useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Upload, Plus, ChevronLeft, ChevronRight, Zap, Target, History, Wand2 } from "lucide-react";
import {
  DashboardHeader,
  PageSkeleton,
  EmptyState,
} from "@/components/dashboard";
import { useResumes } from "@/lib/hooks/use-resumes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { agentClient } from "@/lib/api/agent-client";

function ResumeWorkbench() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job_id");
  const { resumes, loading, error, refetch, uploadResume } = useResumes();
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [tailoring, setTailoring] = useState(false);

  const selectedResume = resumes.find(r => r.id === selectedResumeId) || resumes[0];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadResume(file);
      toast({ title: "Resume Uploaded", description: "Your resume is being processed and indexed." });
    } catch (err) {
      toast({ 
        title: "Upload Failed", 
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive" 
      });
    }
  };

  const handleTailor = async () => {
    if (!jobId) {
      toast({ title: "No Job Selected", description: "Please select a job from the board first." });
      return;
    }
    
    setTailoring(true);
    try {
      await agentClient.startResumeMission({
        job_id: jobId,
      });
      toast({ 
        title: "Tailoring Started! ✨", 
        description: "AI is optimizing your resume for the selected role." 
      });
    } catch (err) {
      toast({ 
        title: "Tailoring Failed", 
        description: err instanceof Error ? err.message : "Error starting mission", 
        variant: "destructive" 
      });
    } finally {
      setTailoring(false);
    }
  };

  if (loading && resumes.length === 0) {
    return <PageSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleUpload}
        accept=".pdf,.docx,.txt"
      />

      <DashboardHeader
        title="Resume Workbench"
        description="Optimize and manage your professional personas"
        action={{
          label: "Direct Upload",
          icon: Upload,
          onClick: () => fileInputRef.current?.click(),
        }}
      />

      {resumes.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-250px)]">
          {/* Sidebar: Resume List */}
          <div className="lg:col-span-3 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Library</h3>
            {resumes.map((resume) => (
              <Card 
                key={resume.id}
                onClick={() => setSelectedResumeId(resume.id)}
                className={`cursor-pointer transition-all border-white/5 bg-white/5 hover:bg-white/10 ${
                  selectedResume?.id === resume.id ? "border-primary bg-primary/5" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedResume?.id === resume.id ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-white">{resume.filename}</p>
                      <p className="text-[10px] text-muted-foreground">Uploaded {new Date(resume.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main: Preview & Diff */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary px-3 py-1">
                     {jobId ? "Contextual Version" : "Master Version"}
                  </Badge>
                  {jobId && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                       <Target className="w-3 h-3" />
                       Matching Job Context
                    </div>
                  )}
               </div>
               <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-9 border-white/10 text-xs gap-2">
                     <History className="w-3.5 h-3.5" />
                     History
                  </Button>
                  <Button 
                    size="sm" 
                    disabled={!jobId || tailoring}
                    onClick={handleTailor}
                    className="h-9 bg-primary text-white text-xs gap-2 px-4 shadow-lg shadow-primary/20"
                  >
                     <Wand2 className={`w-3.5 h-3.5 ${tailoring ? 'animate-spin' : ''}`} />
                     {tailoring ? "Optimizing..." : "Magic Tailor"}
                  </Button>
               </div>
            </div>

            <Card className="flex-1 bg-white/5 border-white/10 overflow-hidden relative">
               <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Zap className="w-32 h-32" />
               </div>
               
               <div className="h-full flex overflow-hidden">
                  {/* Original Content */}
                  <div className="flex-1 p-8 overflow-y-auto border-r border-white/5 bg-black/20">
                     <div className="flex items-center gap-2 mb-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Original Data</span>
                     </div>
                     <pre className="text-sm text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">
                        {selectedResume?.original_content || "No text content extracted."}
                     </pre>
                  </div>

                  {/* Tailored Content / Diff View */}
                  <div className="flex-1 p-8 overflow-y-auto bg-primary/5">
                     <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">AI Optimized</span>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[9px]">98% COMPATIBLE</Badge>
                     </div>
                     
                     {selectedResume?.tailored_content ? (
                        <pre className="text-sm text-foreground font-mono whitespace-pre-wrap leading-relaxed">
                           {selectedResume.tailored_content}
                        </pre>
                     ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                           <div className="p-4 rounded-full bg-white/5">
                              <Zap className="w-8 h-8 text-primary/40" />
                           </div>
                           <div className="max-w-[200px]">
                              <p className="text-sm font-semibold text-white mb-1">Contextual version not ready</p>
                              <p className="text-[10px] text-muted-foreground">Run 'Magic Tailor' to generate a version optimized for the selected job.</p>
                           </div>
                           <Button 
                             size="sm" 
                             variant="secondary" 
                             className="text-[10px] h-8"
                             disabled={!jobId}
                             onClick={handleTailor}
                           >
                             Tailor Now
                           </Button>
                        </div>
                     )}
                  </div>
               </div>
            </Card>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No resumes yet"
          description="Upload your base resume to let the AI start tailoring it for opportunities."
          action={{
            label: "Upload Resume",
            icon: Upload,
            onClick: () => fileInputRef.current?.click(),
          }}
        />
      )}
    </motion.div>
  );
}

export default function ResumesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResumeWorkbench />
    </Suspense>
  );
}
