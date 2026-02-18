"use client";

import { FileText, Upload } from "lucide-react";
import { Sidebar, DashboardHeader, EmptyState } from "@/components/dashboard";

export default function ResumesPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <DashboardHeader
          title="Resume Workbench"
          description="Manage and tailor your resumes"
          action={{
            label: "Upload Resume",
            icon: Upload,
            onClick: () => alert("Resume upload coming soon!"),
          }}
        />

        <EmptyState
          icon={FileText}
          title="No resumes yet"
          description="Upload your resume to get started with tailored applications"
          action={{
            label: "Upload Resume",
            icon: Upload,
            onClick: () => alert("Resume upload coming soon!"),
          }}
        />
      </main>
    </div>
  );
}
