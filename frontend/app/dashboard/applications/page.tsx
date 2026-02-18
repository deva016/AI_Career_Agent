"use client";

import { CheckSquare, Plus } from "lucide-react";
import { Sidebar, DashboardHeader, EmptyState } from "@/components/dashboard";

export default function ApplicationsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <DashboardHeader
          title="Applications"
          description="Track your job applications"
          action={{
            label: "New Application",
            icon: Plus,
            onClick: () => alert("Application tracking coming soon!"),
          }}
        />

        <EmptyState
          icon={CheckSquare}
          title="No applications yet"
          description="Applications submitted by the AI agent will appear here"
          action={{
            label: "View Jobs",
            icon: CheckSquare,
            onClick: () => (window.location.href = "/dashboard/jobs"),
          }}
        />
      </main>
    </div>
  );
}
