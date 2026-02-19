"use client";

import { motion } from "framer-motion";
import { Brain, Star, Clock, ChevronRight, Zap, Target, BookOpen, MessageSquare, Play } from "lucide-react";
import { useState } from "react";
import {
  DashboardHeader,
  PageSkeleton,
  EmptyState,
} from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function InterviewPage() {
  const [activeTab, setActiveTab] = useState("practice");
  const [response, setResponse] = useState("");
  const { toast } = useToast();

  const handleStartSession = () => {
    toast({
      title: "Session Starting 🎙️",
      description: "AI Interviewer is preparing for TechFlow Solutions conversation.",
    });
  };

  const handleAnalyze = () => {
    if (!response) {
      toast({
        title: "Empty Response",
        description: "Please type your answer before analyzing.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Analyzing Response... 🧠",
      description: "Comparing your answer against the STAR method requirements.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <DashboardHeader
        title="Interview Simulator"
        description="AI-driven mock interviews and behavioral question coaching"
        action={{
          label: "Start Mock Session",
          icon: Play,
          onClick: handleStartSession
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Session Content */}
        <div className="lg:col-span-8 space-y-6">
           <Card className="bg-white/5 border-white/10 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <CardContent className="p-8">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                       <div className="p-2 rounded-lg bg-primary/20 text-primary">
                          <MessageSquare className="w-5 h-5" />
                       </div>
                       <div>
                          <h3 className="text-white font-bold">Active Question</h3>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Behavioral • Difficulty: Hard</p>
                       </div>
                    </div>
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-primary">4m 20s remaining</Badge>
                 </div>

                 <div className="space-y-8">
                    <h2 className="text-2xl font-medium text-white leading-relaxed">
                       "Tell me about a time you faced a significant technical blocker during a critical project. How did you communicate this to stakeholders and what was the eventual resolution?"
                    </h2>

                    <div className="space-y-4">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Your Drafted Response</label>
                       <textarea 
                          className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all font-sans leading-relaxed"
                          placeholder="Structure your answer using the STAR method (Situation, Task, Action, Result)..."
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                       />
                       <div className="flex justify-between items-center">
                          <p className="text-[10px] text-muted-foreground italic">Tip: Focus on the 'Action' taken and the measurable 'Result'.</p>
                          <div className="flex gap-2">
                             <Button variant="ghost" className="h-10 text-xs">Save for Later</Button>
                             <Button 
                               onClick={handleAnalyze}
                               className="h-10 bg-primary text-white font-bold px-8 shadow-lg shadow-primary/20"
                             >
                               Analyze Answer
                             </Button>
                          </div>
                       </div>
                    </div>
                 </div>
              </CardContent>
           </Card>

           {/* Feedback View (Hidden by default) */}
           <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Star className="w-4 h-4 text-emerald-400" />
                 </div>
                 <h4 className="font-bold text-white text-sm">AI Feedback</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                 Strong structural flow. Your 'Action' phase effectively demonstrates leadership, but we recommend quantifying the 'Result' more clearly (e.g., "reduced latency by 40%").
              </p>
              <Button variant="link" className="text-primary p-0 h-auto text-[10px] uppercase font-bold tracking-widest">Show Suggested Revision</Button>
           </div>
        </div>

        {/* Right: Resources & History */}
        <div className="lg:col-span-4 space-y-6">
           <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                 <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Target Role Context
                 </h3>
                 <div className="space-y-3">
                    <div className="text-xs p-3 rounded-lg bg-white/5 border border-white/5">
                       <p className="text-muted-foreground mb-1">Company</p>
                       <p className="text-white font-semibold">TechFlow Solutions Inc.</p>
                    </div>
                    <div className="text-xs p-3 rounded-lg bg-white/5 border border-white/5">
                       <p className="text-muted-foreground mb-1">Keywords Detected</p>
                       <div className="flex gap-1 flex-wrap mt-1">
                          {['Microservices', 'K8s', 'Scale', 'Mentorship'].map(k => (
                            <Badge key={k} variant="secondary" className="text-[9px] h-4">{k}</Badge>
                          ))}
                       </div>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Recent Sessions</h3>
              {[
                { title: "Behavioral Prep", date: "2 days ago", score: "85%" },
                { title: "System Design", date: "5 days ago", score: "72%" },
              ].map((session, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 group cursor-pointer hover:bg-white/10 transition-colors">
                   <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                      <Clock className="w-5 h-5" />
                   </div>
                   <div className="flex-1">
                      <p className="text-sm font-bold text-white mb-0.5">{session.title}</p>
                      <p className="text-[10px] text-muted-foreground">{session.date}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-bold text-primary">{session.score}</p>
                   </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:text-white">
                 View All History
                 <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
