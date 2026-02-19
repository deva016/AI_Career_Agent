"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  CheckCircle2, 
  RefreshCw, 
  PenSquare, 
  Brain, 
  Zap, 
  ShieldCheck,
  ChevronRight,
  Info,
  ChevronLeft,
  Target,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DiffViewer } from "./diff-viewer";

interface ReasoningNode {
  section: string;
  logic: string;
  source?: string;
}

interface ReviewWorkbenchProps {
  isOpen: boolean;
  onClose: () => void;
  missionId: string;
  agent: string;
  oldContent: string;
  newContent: string;
  reasoning?: ReasoningNode[];
  onApprove: (id: string, feedback?: string, editedContent?: string) => void;
  onRegenerate: (id: string, feedback: string) => void;
  onManualEdit: (id: string, newContent: string) => void;
}

export function ReviewWorkbench({
  isOpen,
  onClose,
  missionId,
  agent,
  oldContent,
  newContent,
  reasoning = [],
  onApprove,
  onRegenerate,
  onManualEdit,
}: ReviewWorkbenchProps) {
  const [activeTab, setActiveTab] = useState<"diff" | "edit">("diff");
  const [editableContent, setEditableContent] = useState(newContent);
  const [feedback, setFeedback] = useState("");
  const [showReasoning, setShowReasoning] = useState(true);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col"
      >
        {/* Header bar */}
        <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Review & Validation
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-primary">{agent}</span>
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Mission ID: {missionId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex bg-white/5 p-1 rounded-lg border border-white/5 mr-4">
                <Button 
                  variant={activeTab === "diff" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="h-8 text-xs px-4"
                  onClick={() => setActiveTab("diff")}
                >
                  Analysis View
                </Button>
                <Button 
                  variant={activeTab === "edit" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="h-8 text-xs px-4"
                  onClick={() => setActiveTab("edit")}
                >
                  Manual Editor
                </Button>
             </div>
             
             <Separator orientation="vertical" className="h-6 bg-white/10" />

             <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10">
                <X className="w-5 h-5 text-muted-foreground" />
             </Button>
          </div>
        </div>

        {/* Action Bar (Sticky) */}
        <div className="bg-primary/5 border-b border-primary/20 px-6 py-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Badge className="bg-blue-500/20 text-blue-400 border-none px-3 py-1 flex items-center gap-1.5">
                 <Zap className="w-3.5 h-3.5" />
                 HITL REQUIRED
              </Badge>
              <p className="text-sm text-gray-300">
                 The AI has completed the draft. Please verify the semantic changes before finalization.
              </p>
           </div>

           <div className="flex gap-3">
              <div className="flex items-center gap-2 mr-4">
                 <input 
                    type="text" 
                    placeholder="Feedback for regeneration..."
                    className="h-10 w-64 bg-black/40 border border-white/10 rounded-lg px-4 text-xs focus:border-primary/50 outline-none text-white transition-all"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                 />
                 <Button 
                   variant="outline" 
                   className="h-10 border-white/10 text-xs px-6 gap-2 hover:bg-white/5 translate-all active:scale-95"
                   onClick={() => onRegenerate(missionId, feedback)}
                   disabled={!feedback}
                 >
                   <RefreshCw className="w-4 h-4" />
                   Regenerate
                 </Button>
              </div>

              <Button 
                className="h-10 bg-white text-black font-bold px-8 shadow-xl shadow-white/5 hover:bg-gray-200 active:scale-95 transition-all gap-2"
                onClick={() => onApprove(missionId, feedback, editableContent)}
              >
                 <CheckCircle2 className="w-4 h-4" />
                 Approve & Close
              </Button>
           </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
           {/* Side Panels */}
           <div className="flex-1 flex overflow-hidden relative">
              
              {/* Split View Container */}
              <div className={`flex-1 flex overflow-hidden transition-all duration-500 ${showReasoning ? 'mr-80' : ''}`}>
                 
                 {activeTab === "diff" ? (
                   <>
                     {/* Original Panel */}
                     <div className="flex-1 border-r border-white/5 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                           <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Base Content (Input)</span>
                           </div>
                        </div>
                        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-black/20">
                           <pre className="font-mono text-sm text-muted-foreground/60 whitespace-pre-wrap leading-relaxed">
                              {oldContent}
                           </pre>
                        </div>
                     </div>

                     {/* AI Draft Panel */}
                     <div className="flex-1 flex flex-col overflow-hidden bg-primary/5 relative">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-primary/5 backdrop-blur-md">
                           <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-primary" />
                              <span className="text-xs font-bold text-primary uppercase tracking-widest">AI Tailored Draft (Output)</span>
                           </div>
                           <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-none text-[10px]">98% SEMANTIC MATCH</Badge>
                        </div>
                        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                           <DiffViewer oldText={oldContent} newText={newContent} />
                        </div>
                     </div>
                   </>
                 ) : (
                   /* Manual Editor Mode */
                   <div className="flex-1 flex flex-col overflow-hidden bg-black/40">
                      <div className="p-4 border-b border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <PenSquare className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-bold text-white uppercase tracking-widest">Interactive Workbench</span>
                         </div>
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-[10px] text-primary"
                            onClick={() => onManualEdit(missionId, editableContent)}
                         >
                            Apply Edits
                         </Button>
                      </div>
                      <textarea 
                         className="flex-1 p-8 bg-transparent border-none focus:ring-0 text-foreground font-mono text-sm leading-relaxed resize-none outline-none"
                         value={editableContent}
                         onChange={(e) => setEditableContent(e.target.value)}
                         placeholder="Manually refine the content here..."
                      />
                   </div>
                 )}
              </div>

              {/* Reasoning Panel (Right Sidebar) */}
              <div 
                className={`absolute right-0 top-0 bottom-0 w-80 bg-black/60 border-l border-white/10 backdrop-blur-2xl transition-transform duration-500 flex flex-col ${
                  showReasoning ? 'translate-x-0' : 'translate-x-full'
                }`}
              >
                 <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Brain className="w-5 h-5 text-purple-400" />
                       <h3 className="font-bold text-white">Reasoning Trace</h3>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowReasoning(false)}>
                       <ChevronRight className="w-4 h-4" />
                    </Button>
                 </div>

                 <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {reasoning.map((node, i) => (
                      <Card key={i} className="bg-white/5 border-white/5 hover:bg-white/10 transition-colors cursor-help group">
                         <CardContent className="p-4 space-y-2">
                            <div className="flex items-start justify-between">
                               <Badge variant="outline" className="text-[9px] bg-primary/10 border-primary/20 text-primary">
                                  {node.section}
                               </Badge>
                               <Info className="w-3 h-3 text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed italic">
                               "{node.logic}"
                            </p>
                            {node.source && (
                              <div className="flex items-center gap-1.5 pt-2 border-t border-white/5">
                                 <Target className="w-3 h-3 text-muted-foreground" />
                                 <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Source: {node.source}</span>
                              </div>
                            )}
                         </CardContent>
                      </Card>
                    ))}

                    {reasoning.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                         <Brain className="w-12 h-12 mb-4 text-muted-foreground" />
                         <p className="text-sm font-medium">No reasoning nodes available for this mission type.</p>
                      </div>
                    )}
                 </div>

                 <div className="p-4 bg-primary/10 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                       <Zap className="w-4 h-4 text-primary" />
                       <span className="text-[10px] font-bold text-white uppercase tracking-widest">Vector Insight</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-tight">
                       This version has a <span className="text-emerald-400 font-bold">98.2% similarity score</span> with the target Job Description's "Core Skills" cluster.
                    </p>
                 </div>
              </div>

              {/* reasoning toggle button when hidden */}
              {!showReasoning && (
                <Button 
                  className="absolute right-0 top-1/2 -translate-y-1/2 rounded-l-xl rounded-r-none h-20 w-8 bg-primary/20 border border-r-0 border-primary/30 backdrop-blur-md flex flex-col items-center justify-center p-0 hover:bg-primary/30 transition-all"
                  onClick={() => setShowReasoning(true)}
                >
                  <ChevronLeft className="w-4 h-4 text-primary" />
                  <span className="[writing-mode:vertical-lr] text-[9px] font-black uppercase tracking-tighter mt-2 text-primary">Logics</span>
                </Button>
              )}
           </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
