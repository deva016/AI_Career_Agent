"use client";

import { Briefcase, Plus } from "lucide-react";
import { Sidebar, DashboardHeader, EmptyState } from "@/components/dashboard";

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <DashboardHeader
          title="Jobs Board"
          description="Discover and track job opportunities"
          action={{
            label: "Find Jobs",
            icon: Briefcase,
            onClick: () => alert("Job finder coming soon!"),
          }}
        />

        <EmptyState
          icon={Briefcase}
          title="No jobs yet"
          description="Run the Job Finder agent to discover opportunities that match your profile"
          action={{
            label: "Find Jobs",
            icon: Plus,
            onClick: () => alert("Job finder agent coming soon!"),
          }}
        />
      </main>
    </div>
  );
}
