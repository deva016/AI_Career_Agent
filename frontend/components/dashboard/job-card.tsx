"use client";

import { motion } from "framer-motion";
import { Briefcase, MapPin, DollarSign, ExternalLink, ArrowRight, Zap, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Job } from "@/lib/hooks/use-jobs";

interface JobCardProps {
  job: Job;
  index?: number;
}

export function JobCard({ job, index = 0 }: JobCardProps) {
  const matchScorePercent = Math.round((job.match_score || 0.85) * 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 group flex flex-col h-full overflow-hidden relative"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4">
           <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:border-primary/40 transition-colors shrink-0">
              <Briefcase className="w-6 h-6 text-primary" />
           </div>
           <div className="min-w-0">
              <h3 className="font-bold text-white leading-tight group-hover:text-primary transition-colors truncate">{job.title}</h3>
              <p className="text-sm text-muted-foreground font-medium truncate">{job.company}</p>
           </div>
        </div>
        
        <div className="relative w-12 h-12 shrink-0">
           <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-white/10" strokeWidth="3" />
              <motion.circle 
                cx="18" cy="18" r="16" fill="none" 
                className="stroke-primary" 
                strokeWidth="3" 
                strokeDasharray="100, 100"
                initial={{ strokeDashoffset: 100 }}
                animate={{ strokeDashoffset: 100 - matchScorePercent }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 + index * 0.1 }}
                strokeLinecap="round"
              />
           </svg>
           <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white tracking-tighter">
              {matchScorePercent}%
           </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex gap-2 mb-6 flex-wrap">
         <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-muted-foreground font-medium">
            <MapPin className="w-3 h-3" />
            {job.location || "Remote"}
         </div>
         {job.salary_range && (
           <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold tracking-tight">
              <DollarSign className="w-3 h-3" />
              {job.salary_range}
           </div>
         )}
         <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] py-1 px-2.5 rounded-lg font-medium opacity-80">{job.job_type || "Full-time"}</Badge>
      </div>

      {/* AI Reasoning */}
      <div className="flex-1">
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-xs text-muted-foreground leading-relaxed relative group/reasoning">
           <div className="flex items-center gap-1.5 mb-2">
             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
             <span className="text-primary font-bold uppercase tracking-widest text-[10px]">AI Insight</span>
             <div className="ml-auto opacity-50 hover:opacity-100 transition-opacity cursor-help" title="This score is based on vector similarity between your resume and the job description.">
                <Info className="w-3 h-3" />
             </div>
           </div>
           <p className="line-clamp-3 group-hover/reasoning:line-clamp-none transition-all">
             {job.match_reasoning || "High match and relevance to your background in full-stack engineering. Agent detected strong alignment with mentioned tech stack."}
           </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-6">
         <Button 
            className="flex-1 h-10 text-xs font-bold gap-2 group/btn bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
            onClick={() => window.location.href = `/dashboard/resumes?job_id=${job.id}`}
         >
            Tailor Resume
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
         </Button>
         <Button 
            variant="outline" 
            className="h-10 w-10 p-0 border-white/10 hover:bg-white/10 hover:text-white"
            onClick={() => window.open(job.url, '_blank')}
         >
            <ExternalLink className="w-4 h-4" />
         </Button>
      </div>
    </motion.div>
  );
}
