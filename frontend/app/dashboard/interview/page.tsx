"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Star, Clock, ChevronRight, Target, MessageSquare,
  Play, Loader2, CheckCircle2, AlertCircle, Lightbulb, RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const SAMPLE_QUESTION = "Tell me about a time you faced a significant technical blocker.";

interface AnalysisResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  suggested_revision: string;
}


export default function InterviewPage() {
  const [activeQuestion, setActiveQuestion] = useState("");
  const [questionDetails, setQuestionDetails] = useState<any>(null);
  const [response, setResponse] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [showRevision, setShowRevision] = useState(false);
  const { toast } = useToast();

  const fetchQuestion = async () => {
    setLoadingQuestion(true);
    try {
      const res = await fetch("/api/interview/generate-question");
      const data = await res.json();
      setActiveQuestion(data.question);
      setQuestionDetails(data);
    } catch (err) {
      setActiveQuestion(SAMPLE_QUESTION);
    } finally {
      setLoadingQuestion(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, []);

  const handleStartSession = () => {
    setResponse("");
    setAnalysis(null);
    setShowRevision(false);
    fetchQuestion();
    toast({
      title: "New Session 🎙️",
      description: "Generating a fresh question for you...",
    });
  };

  const handleAnalyze = async () => {
    if (!response.trim()) {
      toast({
        title: "Empty Response",
        description: "Please type your answer before analyzing.",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    setAnalysis(null);
    setShowRevision(false);

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: activeQuestion || SAMPLE_QUESTION,
          answer: response,
          role_context: questionDetails ? `Role: ${questionDetails.role} — focus on ${questionDetails.category} skills.` : "Senior Software Engineer — focus on leadership and communication.",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Analysis failed");
      }

      const data: AnalysisResult = await res.json();
      setAnalysis(data);
      toast({
        title: `Analysis Complete! Score: ${data.score}/100`,
        description: data.score >= 75 ? "Great answer! A few tweaks will make it perfect." : "Good effort. Review the feedback below to improve.",
      });
    } catch (err) {
      toast({
        title: "Analysis Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const scoreColor =
    !analysis ? "text-primary"
    : analysis.score >= 80 ? "text-emerald-400"
    : analysis.score >= 60 ? "text-amber-400"
    : "text-red-400";

  const scoreBarColor =
    !analysis ? "bg-primary"
    : analysis.score >= 80 ? "bg-emerald-500"
    : analysis.score >= 60 ? "bg-amber-500"
    : "bg-red-500";

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
          label: "Reset Session",
          icon: RefreshCw,
          onClick: handleStartSession,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Question + Answer + Feedback */}
        <div className="lg:col-span-8 space-y-6">
          {/* Question Card */}
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
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      Behavioral • Difficulty: Hard
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-white/5 border-white/10 text-primary">
                  STAR Method
                </Badge>
              </div>

              <div className="space-y-6">
                <h2 className="text-xl font-medium text-white leading-relaxed">
                  {loadingQuestion ? "Generating question..." : `"${activeQuestion || SAMPLE_QUESTION}"`}
                </h2>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Your Response
                  </label>
                  <textarea
                    className="w-full h-44 bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all font-sans leading-relaxed resize-none"
                    placeholder="Structure your answer using the STAR method:&#10;&#10;• Situation: Set the scene&#10;• Task: Describe your responsibility&#10;• Action: Explain what YOU did&#10;• Result: Share the measurable outcome"
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    disabled={analyzing}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-muted-foreground italic">
                      {response.split(/\s+/).filter(Boolean).length} words · Aim for 200–350 words
                    </p>
                    <Button
                      onClick={handleAnalyze}
                      disabled={analyzing || !response.trim()}
                      className="h-10 bg-primary text-white font-bold px-8 shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Analyze Answer
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Panel — shown after analysis */}
          <AnimatePresence>
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Score Banner */}
                <Card className="bg-white/5 border-white/10 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-white flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-400" />
                        AI Evaluation Score
                      </h4>
                      <span className={`text-3xl font-black ${scoreColor}`}>
                        {analysis.score}<span className="text-lg text-muted-foreground">/100</span>
                      </span>
                    </div>
                    <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${analysis.score}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${scoreBarColor}`}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                      {analysis.feedback}
                    </p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                    <h5 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
                    </h5>
                    <ul className="space-y-2">
                      {analysis.strengths.map((s: string, i: number) => (
                        <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvements */}
                  <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                    <h5 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5" /> Improvements
                    </h5>
                    <ul className="space-y-2">
                      {analysis.improvements.map((imp: string, i: number) => (
                        <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                          <span className="text-amber-400 mt-0.5 shrink-0">→</span>
                          {imp}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Suggested Revision */}
                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <Lightbulb className="w-3.5 h-3.5" /> AI Suggested Revision
                    </h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRevision(!showRevision)}
                      className="text-[10px] text-primary hover:text-primary/80 h-6 px-2"
                    >
                      {showRevision ? "Hide" : "Show"}
                    </Button>
                  </div>
                  <AnimatePresence>
                    {showRevision && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs text-gray-300 leading-relaxed overflow-hidden"
                      >
                        {analysis.suggested_revision}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  {!showRevision && (
                    <p className="text-xs text-muted-foreground italic">
                      Click "Show" to reveal the AI-suggested version of your answer.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Context & History */}
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
                  <p className="text-muted-foreground mb-1">Keywords to Hit</p>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {["Microservices", "K8s", "Scale", "Stakeholders", "Mentorship"].map((k) => (
                      <Badge key={k} variant="secondary" className="text-[9px] h-4">
                        {k}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-xs p-3 rounded-lg bg-white/5 border border-white/5">
                  <p className="text-muted-foreground mb-2">STAR Checklist</p>
                  {["Situation", "Task", "Action", "Result"].map((part) => (
                    <div key={part} className="flex items-center gap-2 py-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        response.toLowerCase().includes(part.toLowerCase().slice(0, 4))
                          ? "bg-emerald-400"
                          : "bg-white/20"
                      }`} />
                      <span className="text-muted-foreground">{part}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
              Recent Sessions
            </h3>
            {[
              { title: "Behavioral Prep", date: "2 days ago", score: "85%" },
              { title: "System Design", date: "5 days ago", score: "72%" },
            ].map((session, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 group cursor-pointer hover:bg-white/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white mb-0.5">{session.title}</p>
                  <p className="text-[10px] text-muted-foreground">{session.date}</p>
                </div>
                <p className="text-xs font-bold text-primary">{session.score}</p>
              </div>
            ))}
            <Button
              variant="ghost"
              className="w-full text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:text-white"
            >
              View All History
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
