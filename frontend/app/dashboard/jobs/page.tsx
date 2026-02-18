"use client";

import { motion } from "framer-motion";
import { Plus, Filter, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import {
  DashboardHeader,
  PageSkeleton,
  EmptyState,
} from "@/components/dashboard";
import { JobCard } from "@/components/dashboard/job-card";
import { useJobs } from "@/lib/hooks/use-jobs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const { jobs, loading, error } = useJobs({ status });

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.company.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && jobs.length === 0) {
    return <PageSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <DashboardHeader
        title="Jobs Board"
        description="High-match opportunities found by your discovery agents"
        action={{
          label: "Discovery Mission",
          icon: Plus,
          onClick: () => {
             window.location.href = "/dashboard/missions";
          }
        }}
      />

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by title or company..." 
            className="pl-10 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px] bg-white/5 border-white/10">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                <SelectItem value="found">Newly Found</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
              </SelectContent>
           </Select>
           <Button variant="outline" size="icon" className="border-white/10 bg-white/5">
              <SlidersHorizontal className="w-4 h-4" />
           </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium">
          {error}
        </div>
      )}

      {/* Grid */}
      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
          {filteredJobs.map((job, index) => (
            <JobCard key={job.id} job={job} index={index} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="No jobs found"
          description={search ? `No jobs matching "${search}"` : "Your agents haven't found any high-match jobs yet."}
          action={{
            label: "Launch Agent",
            icon: Plus,
            onClick: () => window.location.href = "/dashboard/missions"
          }}
        />
      )}
    </motion.div>
  );
}
