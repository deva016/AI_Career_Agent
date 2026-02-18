"use client";

import { motion } from "framer-motion";
import { CheckSquare, Plus, Search, Filter, ChevronRight, Clock, Building2, ExternalLink } from "lucide-react";
import { useState } from "react";
import {
  DashboardHeader,
  PageSkeleton,
  EmptyState,
} from "@/components/dashboard";
import { useApplications } from "@/lib/hooks/use-applications";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ApplicationsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const { applications, loading, error } = useApplications({ status });

  const filteredApps = applications.filter(app => 
    (app.job_title?.toLowerCase().includes(search.toLowerCase()) || 
     app.job_company?.toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "text-blue-400 bg-blue-400/10";
      case "interviewing": return "text-purple-400 bg-purple-400/10";
      case "offered": return "text-emerald-400 bg-emerald-400/10";
      case "rejected": return "text-red-400 bg-red-400/10";
      default: return "text-yellow-400 bg-yellow-400/10";
    }
  };

  if (loading && applications.length === 0) {
    return <PageSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <DashboardHeader
        title="Application Tracker"
        description="History and status of your AI-managed job submissions"
        action={{
          label: "View Results",
          icon: CheckSquare,
          onClick: () => window.location.href = "/dashboard/jobs",
        }}
      />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search applications..." 
            className="pl-10 bg-white/5 border-white/10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="interviewing">Interviewing</SelectItem>
            <SelectItem value="offered">Offered</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium">
          {error}
        </div>
      )}

      {/* List */}
      {filteredApps.length > 0 ? (
        <div className="space-y-4 pb-20">
          {filteredApps.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-white/5 border-white/10 overflow-hidden group hover:bg-white/10 transition-colors">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row sm:items-center p-6 gap-4">
                     <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        <Building2 className="w-6 h-6" />
                     </div>
                     
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white truncate">{app.job_title || "Software Engineer"}</h3>
                          <Badge variant="outline" className={`text-[9px] px-2 py-0 h-4 ${getStatusColor(app.status)} border-none shadow-sm`}>
                             {app.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                           <span className="font-medium">{app.job_company || "Company"}</span>
                           <span className="w-1 h-1 rounded-full bg-white/10" />
                           <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(app.applied_at || app.created_at).toLocaleDateString()}
                           </span>
                        </div>
                     </div>

                     <div className="flex items-center gap-2 ml-auto">
                        <Button variant="ghost" size="sm" className="h-9 px-3 text-xs gap-2 text-muted-foreground hover:text-white" onClick={() => app.job_url && window.open(app.job_url, '_blank')}>
                           View JD
                           <ExternalLink className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-9 w-9 border-white/10 hover:bg-white/10">
                           <ChevronRight className="w-4 h-4" />
                        </Button>
                     </div>
                  </div>
                  
                  {/* Status Timeline Visualization */}
                  <div className="px-6 pb-6 pt-2 flex items-center gap-1">
                     <div className="flex-1 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.3)] transition-all" />
                     <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${['submitted', 'interviewing', 'offered'].includes(app.status) ? 'bg-primary shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'bg-white/5'}`} />
                     <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${['interviewing', 'offered'].includes(app.status) ? 'bg-primary shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'bg-white/5'}`} />
                     <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${app.status === 'offered' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-white/5'}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CheckSquare}
          title="No applications tracking"
          description={search ? "No applications matching your search." : "Autonomous application agents haven't submitted any forms for you yet."}
          action={{
            label: "Explore Jobs",
            icon: Search,
            onClick: () => window.location.href = "/dashboard/jobs",
          }}
        />
      )}
    </motion.div>
  );
}
