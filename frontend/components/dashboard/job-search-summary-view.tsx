"use client";

import { CheckCircle2, ExternalLink, Briefcase, MapPin, Search, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface JobDetail {
  title: string;
  company: string;
  location: string;
  url: string;
}

interface JobSearchSummaryData {
  jobs_found: number;
  newly_stored: number;
  details: JobDetail[];
  criteria: {
    keywords: string[];
    locations: string[];
    experience_level?: string;
    job_type?: string;
    remote_ok?: boolean;
  };
}

interface JobSearchSummaryViewProps {
  data: JobSearchSummaryData;
}

export function JobSearchSummaryView({ data }: JobSearchSummaryViewProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center gap-4 shadow-lg shadow-primary/5"
        >
          <div className="p-3 rounded-xl bg-primary/20 text-primary ring-1 ring-primary/30">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-primary/70 uppercase tracking-widest">Jobs Found</p>
            <h3 className="text-3xl font-black text-white">{data.jobs_found}</h3>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center gap-4 shadow-lg shadow-emerald-500/5"
        >
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-400/70 uppercase tracking-widest">Added to Database</p>
            <h3 className="text-3xl font-black text-white">{data.newly_stored}</h3>
          </div>
        </motion.div>
      </div>

      {/* Criteria */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-2xl bg-white/5 border border-white/10"
      >
        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10">Search Strategy</Badge>
        </h4>
        <div className="flex flex-wrap gap-2">
          {(data.criteria?.keywords || []).map((kw, i) => (
            <Badge key={i} variant="secondary" className="bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 transition-colors">
              {kw}
            </Badge>
          ))}
          {(data.criteria?.locations || []).map((loc, i) => (
            <Badge key={i} variant="outline" className="border-primary/30 text-primary-foreground/80 bg-primary/10">
              <MapPin className="w-3 h-3 mr-1" />
              {loc}
            </Badge>
          ))}
        </div>
      </motion.div>

      {/* Results List */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white/50 uppercase tracking-widest pl-2">Top Opportunities Found</h4>
        <div className="grid grid-cols-1 gap-3">
          {data.details?.length > 0 ? (
            data.details.map((job, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-white/5 text-white/40 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white group-hover:text-primary transition-colors leading-tight">{job.title}</h5>
                    <p className="text-sm text-gray-400 mt-1">{job.company} • {job.location}</p>
                  </div>
                </div>
                <Button 
                  asChild 
                  variant="outline" 
                  size="sm" 
                  className="bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-white rounded-xl transition-all h-10 px-5"
                >
                  <a href={job.url} target="_blank" rel="noopener noreferrer" className="gap-2 font-bold text-xs">
                    View & Apply
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Button>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 rounded-2xl border border-dashed border-white/10 bg-white/5">
              <p className="text-gray-400">No specific job details available in this summary.</p>
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-center text-gray-500 font-medium">
        This mission was completed successfully by your AI Agent. Found jobs are now available in your main Jobs dashboard for further analysis and tailoring.
      </p>
    </div>
  );
}
