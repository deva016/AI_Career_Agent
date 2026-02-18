import { Sidebar } from "@/components/dashboard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 relative">
        {/* Subtle grid background */}
        <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] pointer-events-none" />
        
        {/* Content area */}
        <div className="p-4 md:p-8 pt-20 md:pt-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
