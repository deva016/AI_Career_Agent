"use client";

import { Share2, Sparkles } from "lucide-react";
import { Sidebar, DashboardHeader, EmptyState } from "@/components/dashboard";

export default function LinkedInPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <DashboardHeader
          title="LinkedIn Studio"
          description="Generate and manage LinkedIn posts"
          action={{
            label: "Generate Post",
            icon: Sparkles,
            onClick: () => alert("LinkedIn post generation coming soon!"),
          }}
        />

        <EmptyState
          icon={Share2}
          title="No LinkedIn posts yet"
          description="Use the AI to generate engaging LinkedIn content"
          action={{
            label: "Generate Post",
            icon: Sparkles,
            onClick: () => alert("LinkedIn post generation coming soon!"),
          }}
        />
      </main>
    </div>
  );
}
