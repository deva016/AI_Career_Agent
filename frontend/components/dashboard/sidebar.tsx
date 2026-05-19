"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Share2,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  Target,
  CheckSquare,
  Zap,
  TrendingUp,
  Brain,
  FolderOpen,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Missions", icon: Target, href: "/dashboard/missions" },
  { label: "Jobs", icon: Briefcase, href: "/dashboard/jobs" },
  { label: "Resumes", icon: FileText, href: "/dashboard/resumes" },
  { label: "Applications", icon: CheckSquare, href: "/dashboard/applications" },
  { label: "LinkedIn", icon: Share2, href: "/dashboard/linkedin" },
  { label: "Interview", icon: Brain, href: "/dashboard/interview" },
  { label: "Documents", icon: FolderOpen, href: "/dashboard/artifacts" },
  { label: "Insights", icon: BarChart2, href: "/dashboard/insights" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3 group relative">
          <div className="absolute -inset-2 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center border border-white/20 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300 relative z-10">
            <Zap className="w-5 h-5 text-white fill-white/20" />
          </div>
          <div className="relative z-10">
            <h1 className="text-xl font-black bg-gradient-to-r from-white via-white to-primary/80 bg-clip-text text-transparent tracking-tight">
              AI Career
            </h1>
            <p className="text-[9px] text-primary/60 uppercase tracking-[0.2em] font-black -mt-0.5">
              Command Center
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 relative">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative group ${
                isActive
                  ? "bg-primary/10 text-primary shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeGlow"
                  className="absolute left-0 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_15px_rgba(59,130,246,0.8)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className={`w-4 h-4 transition-all duration-300 ${isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "group-hover:scale-110 group-hover:text-white"}`} />
              <span className={`text-sm font-bold tracking-tight transition-colors ${isActive ? "text-white" : "group-hover:text-white"}`}>
                {item.label}
              </span>
              {item.label === "Missions" && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 space-y-4">
        {/* AI Capacity Indicator */}
        <div className="px-5 py-5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 space-y-3 relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Brain className="w-8 h-8 text-primary" />
          </div>
          <div className="flex justify-between items-center text-[9px] text-white/40 uppercase tracking-[0.2em] font-black relative z-10">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-primary" />
              Efficiency
            </span>
            <span className="text-primary drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">{session?.user ? "92%" : "0%"}</span>
          </div>
          <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: session?.user ? "92%" : "0%" }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-purple-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
            />
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed relative z-10 font-medium italic opacity-70">
            Agents active & performing at peak capacity.
          </p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="relative">
            <Avatar className="w-10 h-10 border border-white/10 shadow-lg group-hover:border-primary/50 transition-colors">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary text-xs font-black">
                {session?.user?.name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black truncate text-white tracking-tight">
              {session?.user?.name || "User Name"}
            </p>
            <p className="text-[10px] text-primary/60 truncate font-black uppercase tracking-widest">
              {session?.user ? "Elite Agent" : "Guest Mode"}
            </p>
          </div>
          <Button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            variant="ghost"
            size="icon"
            className="text-white/20 h-9 w-9 hover:bg-red-500/10 hover:text-red-400 group/logout transition-all rounded-xl"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover/logout:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-black/40 backdrop-blur-md border border-white/10"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-white/10 bg-black/40 backdrop-blur-xl flex-col fixed h-full z-30 shadow-2xl">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`md:hidden fixed left-0 top-0 h-full w-64 bg-black/95 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 flex flex-col ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
