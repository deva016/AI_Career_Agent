"use client";

import { useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Upload, Plus, ChevronLeft, Zap, 
  Target, History, Wand2, Trash2, Loader2, 
  Sparkles, Briefcase, ChevronDown, CheckCircle2,
  RefreshCw, ShieldCheck
} from "lucide-react";
import {
  DashboardHeader,
  PageSkeleton,
  EmptyState,
} from "@/components/dashboard";

const PDFViewer = dynamic(
  () => import("@/components/dashboard/pdf-viewer").then((mod) => mod.PDFViewer),
  { ssr: false, loading: () => (
    <div className="flex flex-col items-center justify-center h-full text-white/40">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <span className="text-xs font-bold uppercase tracking-widest">Loading PDF Engine...</span>
    </div>
  )}
);
import { useResumes } from "@/lib/hooks/use-resumes";
import { useJobs } from "@/lib/hooks/use-jobs";
import { useMissions, useApproveMission } from "@/lib/hooks/use-missions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { agentClient } from "@/lib/api/agent-client";
import { ReviewWorkbench } from "@/components/dashboard/review-workbench";

function ResumeWorkbench() {
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get("job_id");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(initialJobId);
  const { resumes, loading, error, refetch, uploadResume, deleteResume } = useResumes();
  const { jobs } = useJobs();
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [tailoring, setTailoring] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [manualEntryMode, setManualEntryMode] = useState(false);
  const [manualText, setManualText] = useState("");
  const [showJobPicker, setShowJobPicker] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const { missions, refetch: refetchMissions } = useMissions();
  const { approve } = useApproveMission();

  const selectedResume = resumes.find(r => r.id === (selectedResumeId || resumes[0]?.id)) || resumes[0];
  const activeJob = jobs.find(j => j.id === selectedJobId);
  
  // Find active mission for this resume
  const activeMission = missions.find(m => 
    m.agent_type === "resume" && 
    m.input_data?.resume_id === selectedResume?.id &&
    ["running", "pending", "needs_review", "executing", "thinking"].includes(m.status)
  );

  const isMissionReviewable = activeMission?.status === "needs_review";

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this resume?")) return;
    
    setDeleting(id);
    try {
      await deleteResume(id);
      toast({ title: "Resume Deleted" });
      if (selectedResumeId === id) setSelectedResumeId(null);
    } catch (err) {
      toast({ title: "Delete Failed", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast({ title: "Uploading...", description: "Securely transferring and analyzing your document..." });

    try {
      await uploadResume(file);
      toast({ title: "Analysis Complete", description: "Your resume is now loaded into the matrix." });
    } catch (err) {
      toast({ title: "Upload Failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
      // Reset input value so the same file can be uploaded again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveManual = async () => {
    if (!manualText.trim()) return;
    try {
      const blob = new Blob([manualText], { type: 'text/plain' });
      const file = new File([blob], "manual_resume.txt", { type: 'text/plain' });
      await uploadResume(file);
      setManualEntryMode(false);
      setManualText("");
      toast({ title: "Resume Created" });
    } catch (err) {
      toast({ title: "Failed to Save", variant: "destructive" });
    }
  };

  const handleTailor = async () => {
    if (!selectedJobId) {
      setShowJobPicker(true);
      toast({ title: "Select a Job", description: "Choose a target role to optimize your resume." });
      return;
    }
    
    setTailoring(true);
    try {
      await agentClient.startResumeMission({ 
        job_id: selectedJobId,
        resume_id: selectedResume?.id
      });
      toast({ title: "Tailoring Started! ✨", description: "AI is optimizing your resume for the role." });
    } catch (err) {
      toast({ title: "Tailoring Failed", variant: "destructive" });
    } finally {
      setTailoring(false);
    }
  };

  if (loading && resumes.length === 0) return <PageSkeleton />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <input type="file" className="hidden" ref={fileInputRef} onChange={handleUpload} accept=".pdf,.docx,.txt" />

      <DashboardHeader
        title="Resume Workbench"
        description="Optimize and manage your professional personas"
        action={manualEntryMode ? { label: "Save Entry", icon: Zap, onClick: handleSaveManual } : { label: "Manual Entry", icon: Plus, onClick: () => setManualEntryMode(true) }}
        secondaryAction={!manualEntryMode ? { label: "Upload PDF", icon: Upload, onClick: () => fileInputRef.current?.click() } : { label: "Cancel", icon: ChevronLeft, onClick: () => setManualEntryMode(false) }}
      />

      <AnimatePresence mode="wait">
        {manualEntryMode ? (
          <motion.div key="manual" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="w-full">
             <Card className="bg-white/5 border-primary/20 shadow-2xl overflow-hidden rounded-3xl">
                <div className="bg-primary/10 px-6 py-4 border-b border-primary/20 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h3 className="text-white font-black text-sm uppercase tracking-widest">Master Data Intake</h3>
                   </div>
                </div>
                <CardContent className="p-0">
                   <textarea
                      autoFocus
                      className="w-full h-[600px] bg-transparent p-8 text-sm text-foreground focus:outline-none transition-all font-mono leading-relaxed resize-none custom-scrollbar"
                      placeholder="Paste your resume text here..."
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                   />
                </CardContent>
             </Card>
          </motion.div>
        ) : (
          <motion.div key="workbench" className="space-y-8">
            {resumes.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[700px]">
                {/* Sidebar: Library */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Library</h3>
                    <div className="flex items-center gap-2">
                       {isUploading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                       <Badge variant="outline" className="text-[9px] h-4 bg-white/5 border-white/10">{resumes.length} Files</Badge>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                    {isUploading && (
                      <Card className="border-white/5 bg-white/5 relative overflow-hidden animate-pulse">
                        <CardContent className="p-4 flex items-center justify-center gap-3">
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                          <span className="text-xs font-black text-white/60 uppercase">Ingesting...</span>
                        </CardContent>
                      </Card>
                    )}
                    {resumes.map((resume) => (
                      <Card 
                        key={resume.id}
                        onClick={() => setSelectedResumeId(resume.id)}
                        className={`group cursor-pointer transition-all duration-300 border-white/5 bg-white/5 hover:bg-white/10 relative overflow-hidden ${
                          selectedResume?.id === resume.id ? "ring-2 ring-primary bg-primary/10 border-transparent shadow-lg shadow-primary/20" : ""
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${selectedResume?.id === resume.id ? "bg-primary text-white" : "bg-white/10 text-white/40"}`}>
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-black truncate text-white tracking-tight">{resume.title || resume.filename || "Untitled Resume"}</p>
                                <p className="text-[9px] text-white/40 font-bold uppercase tracking-tighter">
                                  {new Date(resume.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white/20 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                              onClick={(e) => handleDelete(resume.id, e)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Main: Workbench */}
                <div className="lg:col-span-9 flex flex-col gap-6">
                  {/* Context Control Bar */}
                  <div className="flex items-center justify-between bg-white/5 p-2 pr-2 rounded-2xl border border-white/10 backdrop-blur-xl">
                     <div className="flex items-center gap-4 pl-4">
                        <div className="relative">
                          <div className={`w-3 h-3 rounded-full ${selectedJobId ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]" : "bg-primary shadow-[0_0_15px_rgba(59,130,246,0.8)]"} animate-pulse`} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Current Optimization Focus</span>
                          <button 
                            onClick={() => setShowJobPicker(!showJobPicker)}
                            className="flex items-center gap-2 text-[11px] font-black text-white hover:text-primary transition-colors uppercase"
                          >
                            {activeJob ? activeJob.title : "Select Target Career Goal"}
                            <ChevronDown className={`w-3 h-3 transition-transform ${showJobPicker ? "rotate-180" : ""}`} />
                          </button>
                        </div>
                     </div>

                     <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          disabled={tailoring}
                          onClick={handleTailor}
                          className={`h-10 text-white text-xs font-black gap-2 px-6 rounded-xl shadow-xl transition-all border ${!selectedJobId ? "bg-white/10 border-white/10 hover:bg-white/20 text-white/60" : "bg-gradient-to-r from-primary to-purple-600 hover:scale-105 active:scale-95 shadow-primary/30 border-white/20"}`}
                        >
                           {tailoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                           {tailoring ? "Architecting..." : "Magic Tailor"}
                        </Button>
                     </div>
                  </div>

                  {/* Job Picker Overlay */}
                  <AnimatePresence>
                    {showJobPicker && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3"
                      >
                        {jobs.length > 0 ? jobs.map(job => (
                          <button
                            key={job.id}
                            onClick={() => { setSelectedJobId(job.id); setShowJobPicker(false); }}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all border text-left ${selectedJobId === job.id ? "bg-primary/20 border-primary" : "bg-white/5 border-white/5 hover:bg-white/10"}`}
                          >
                            <Briefcase className="w-4 h-4 text-primary" />
                            <div className="min-w-0">
                              <p className="text-[11px] font-black text-white truncate">{job.title}</p>
                              <p className="text-[9px] text-white/40 uppercase font-bold">{job.company}</p>
                            </div>
                            {selectedJobId === job.id && <CheckCircle2 className="w-3 h-3 ml-auto text-primary" />}
                          </button>
                        )) : (
                          <div className="md:col-span-2 flex flex-col items-center justify-center p-6 space-y-3 bg-white/5 rounded-xl border border-dashed border-white/20">
                            <p className="text-xs text-white/60 font-bold">No saved roles found yet in your pipeline.</p>
                            <Link href="/dashboard/jobs">
                              <Button variant="outline" size="sm" className="h-8 text-[10px] border-white/20 uppercase font-black hover:bg-primary/20 hover:text-primary">
                                Launch Job Finder Mode
                              </Button>
                            </Link>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Split View */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 h-full">
                    {/* Source View */}
                    <Card className="bg-black/40 border-white/5 flex flex-col overflow-hidden rounded-3xl group shadow-2xl relative">
                      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Raw Intelligence Source</span>
                        </div>
                      </div>
                      {selectedResume?.pdf_url && selectedResume.pdf_url.toLowerCase().endsWith(".pdf") ? (
                        <div className="flex-1 overflow-hidden relative">
                          <PDFViewer url={selectedResume.pdf_url.includes('vercel-storage.com') ? `/api/resumes/pdf?url=${encodeURIComponent(selectedResume.pdf_url)}` : selectedResume.pdf_url} />
                        </div>
                      ) : (
                        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-gradient-to-b from-transparent to-black/30 relative">
                          {selectedResume?.original_content ? (
                            <pre className="text-sm text-white/60 font-mono whitespace-pre-wrap leading-relaxed selection:bg-primary/30">
                              {selectedResume.original_content}
                            </pre>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-30">
                              <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                                <FileText className="w-10 h-10" />
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-black text-white uppercase tracking-widest">Extraction Missing</p>
                                <p className="text-[10px] max-w-[200px] leading-relaxed font-bold">
                                  Content extraction failed or this file predates the RAG system.
                                </p>
                                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="mt-4 border-white/20 text-[10px] h-8 rounded-full uppercase font-black">Re-Upload Master</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>

                    {/* AI View */}
                    <Card className="bg-primary/5 border-primary/20 flex flex-col overflow-hidden rounded-3xl relative shadow-[0_0_50px_rgba(59,130,246,0.1)] group">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-600/5 pointer-events-none" />
                      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                        <Zap className="w-64 h-64 text-primary" />
                      </div>
                      
                      <div className="px-6 py-4 border-b border-primary/10 flex items-center justify-between bg-primary/10 relative z-10">
                         <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Contextual AI Optimization</span>
                         </div>
                        {selectedResume?.tailored_content && (
                          <Badge className="bg-emerald-500 text-black font-black text-[9px] h-5 border-none shadow-[0_0_10px_rgba(16,185,129,0.5)]">95.4% MATCH</Badge>
                        )}
                      </div>
                      
                      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar relative z-10 bg-white/[0.01]">
                        {activeMission ? (
                          <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
                            <div className="space-y-6">
                              <motion.div 
                                animate={isMissionReviewable ? {} : { rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center border border-white/20 shadow-2xl mx-auto ${isMissionReviewable ? 'bg-amber-500/20 shadow-amber-500/40 border-amber-500/30' : 'bg-primary/20 shadow-primary/40 border-primary/30'}`}
                              >
                                {isMissionReviewable ? <ShieldCheck className="w-10 h-10 text-amber-500" /> : <Loader2 className="w-10 h-10 text-primary animate-spin" />}
                              </motion.div>
                              <div className="space-y-3">
                                <h4 className="text-2xl font-black text-white tracking-tighter">
                                  {isMissionReviewable ? "Review Ready" : "Optimization in Progress"}
                                </h4>
                                <p className="text-[12px] text-white/40 max-w-[280px] leading-relaxed font-bold italic mx-auto">
                                  {isMissionReviewable 
                                    ? "The AI has finished the draft. Please validate the side-by-side changes to finalize."
                                    : "Our agents are currently architecting your optimized professional persona."}
                                </p>
                              </div>
                              {isMissionReviewable && (
                                <Button 
                                  size="lg"
                                  onClick={() => setShowReview(true)}
                                  className="font-black rounded-2xl h-14 px-10 bg-amber-500 text-black hover:bg-amber-400 shadow-xl shadow-amber-500/40 gap-2 active:scale-95 transition-all mt-4"
                                >
                                  <ShieldCheck className="w-5 h-5" />
                                  Launch Review Hub
                                </Button>
                              )}
                            </div>
                          </div>
                        ) : selectedResume?.tailored_content ? (
                          <div className="space-y-6">
                             <div className="flex items-center justify-between mb-4">
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1 gap-1.5 font-bold text-[10px]">
                                   <CheckCircle2 className="w-3.5 h-3.5" />
                                   SYNCED TO LIBRARY
                                </Badge>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={handleTailor}
                                  className="text-white/40 hover:text-white group gap-2 h-7 px-2 text-[10px] font-black uppercase tracking-widest"
                                >
                                  <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                                  Re-Tailor
                                </Button>
                             </div>
                             <pre className="text-sm text-foreground font-mono whitespace-pre-wrap leading-relaxed selection:bg-primary/30 opacity-90">
                               {selectedResume.tailored_content}
                             </pre>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
                             <motion.div 
                               animate={{ 
                                 scale: [1, 1.05, 1],
                                 rotate: [0, 5, -5, 0]
                               }}
                               transition={{ duration: 4, repeat: Infinity }}
                               className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center border border-white/20 shadow-2xl shadow-primary/40 mx-auto"
                             >
                               <Wand2 className="w-10 h-10 text-white drop-shadow-lg" />
                             </motion.div>
                             <div className="space-y-3">
                               <h4 className="text-2xl font-black text-white tracking-tighter">Optimize Your Persona</h4>
                               <p className="text-[12px] text-white/40 max-w-[280px] leading-relaxed font-bold italic mx-auto">
                                 {selectedJobId 
                                   ? `Tailor your professional story specifically for the "${activeJob?.title}" role at ${activeJob?.company}.`
                                   : "Select a career goal above to start the AI optimization process."
                                 }
                               </p>
                             </div>
                             <Button 
                               size="lg" 
                               disabled={tailoring}
                               onClick={handleTailor}
                               className={`font-black rounded-2xl h-14 px-10 shadow-2xl transition-all active:scale-95 group mx-auto ${!selectedJobId ? "bg-white/10 text-white/50 border border-white/10 hover:bg-white/20" : "bg-white text-black hover:bg-white/90"}`}
                             >
                               {tailoring ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Zap className="w-5 h-5 mr-3 group-hover:fill-current" />}
                               Start Magic Tailoring
                             </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="Your Pipeline is Dormant"
                description="Initialize your professional matrix by uploading a master resume for AI analysis."
                action={{ label: "Register Source Data", icon: Upload, onClick: () => fileInputRef.current?.click() }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {activeMission && (
        <ReviewWorkbench
          isOpen={showReview}
          onClose={() => setShowReview(false)}
          missionId={activeMission.mission_id}
          agent="Resume Architect"
          oldContent={selectedResume?.original_content || "Original content not found"}
          newContent={activeMission.artifacts?.[0]?.content || activeMission.output_data?.content || ""}
          reasoning={activeMission.output_data?.reasoning}
          similarityScore={activeMission.output_data?.similarity_score}
          onApprove={async (id, feedback, edited) => {
            const res = await approve(id, true, feedback, edited);
            if (res.success) {
              setShowReview(false);
              toast({ title: "Resume Tailored! ✨", description: "Optimization synced to your library." });
              refetch();
              refetchMissions();
            }
          }}
          onRegenerate={async (id, feedback) => {
            const res = await approve(id, false, feedback);
            if (res.success) {
               setShowReview(false);
               toast({ title: "Regeneration Started", description: "Incorporating your feedback..." });
               refetchMissions();
            }
          }}
          onManualEdit={() => {}} // Handle locally in ReviewWorkbench
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
