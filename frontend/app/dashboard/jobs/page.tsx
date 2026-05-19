"use client";

import { motion } from "framer-motion";
import { Plus, Filter, Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  DashboardHeader,
  PageSkeleton,
  EmptyState,
  LaunchMissionModal,
} from "@/components/dashboard";
import { JobCard } from "@/components/dashboard/job-card";
import { useJobs } from "@/lib/hooks/use-jobs";
import { useToast } from "@/hooks/use-toast";
import { agentClient } from "@/lib/api/agent-client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 12;

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [offset, setOffset] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const { toast } = useToast();
  
  const { jobs, total, loading, error } = useJobs({ 
    status, 
    limit: ITEMS_PER_PAGE, 
    offset 
  });

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.company.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const currentPage = Math.floor(offset / ITEMS_PER_PAGE) + 1;

  const handleNext = () => {
    if (offset + ITEMS_PER_PAGE < total) {
      setOffset(prev => prev + ITEMS_PER_PAGE);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (offset - ITEMS_PER_PAGE >= 0) {
      setOffset(prev => prev - ITEMS_PER_PAGE);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading && jobs.length === 0) {
    return <PageSkeleton />;
  }

  const handleLaunchMission = async (params: { query: string; target_roles: string[]; target_locations: string[] }) => {
    setIsLaunching(true);
    try {
      await agentClient.startJobFinder(params);
      toast({
        title: "Agents Deployed!",
        description: "Your autonomous hunters are now searching the web for roles.",
      });
      setIsModalOpen(false);
    } catch (err) {
      toast({
        title: "Launch Failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLaunching(false);
    }
  };

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
          onClick: () => setIsModalOpen(true)
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
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0); // Reset pagination on search
            }}
          />
        </div>
        <div className="flex gap-2">
           <Select value={status} onValueChange={(val) => {
             setStatus(val);
             setOffset(0); // Reset pagination on status change
           }}>
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
        <div className="space-y-10 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredJobs.map((job, index) => (
              <JobCard key={job.id} job={job} index={index} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/10 pt-6">
              <p className="text-sm text-gray-400">
                Showing <span className="text-white font-medium">{offset + 1}</span> to{" "}
                <span className="text-white font-medium">
                  {Math.min(offset + ITEMS_PER_PAGE, total)}
                </span>{" "}
                of <span className="text-white font-medium">{total}</span> jobs
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrev}
                  disabled={offset === 0}
                  className="bg-white/5 border-white/10 hover:bg-white/10"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNext}
                  disabled={offset + ITEMS_PER_PAGE >= total}
                  className="bg-white/5 border-white/10 hover:bg-white/10"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="No jobs found"
          description={search ? `No jobs matching "${search}"` : "Your agents haven't found any high-match jobs yet."}
          action={{
            label: "Search Database or Web",
            icon: Plus,
            onClick: () => setIsModalOpen(true)
          }}
        />
      )}

      <LaunchMissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLaunch={handleLaunchMission}
        isLaunching={isLaunching}
        initialQuery={search}
      />
    </motion.div>
  );
}
