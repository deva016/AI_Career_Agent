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
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:border-primary/50 transition-colors">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              AI Career
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold -mt-1 opacity-70">
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 relative group ${
                isActive
                  ? "bg-primary/10 text-primary"
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
              <item.icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
              <span className="text-sm font-medium">{item.label}</span>
              {item.label === "Missions" && (
                <span className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 space-y-4">
        {/* AI Capacity Indicator */}
        <div className="px-3 py-4 rounded-xl bg-white/5 border border-white/10 space-y-2 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-wider font-extrabold relative z-10">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Efficiency
            </span>
            <span className="text-primary">85%</span>
          </div>
          <Progress value={85} className="h-1.5 bg-white/10" />
          <p className="text-[10px] text-muted-foreground leading-tight relative z-10 opacity-70">
            Agents performing at peak capacity.
          </p>
        </div>

        <Separator className="bg-white/10" />
        
        <div className="flex items-center gap-3 px-2">
          <Avatar className="w-9 h-9 border border-white/10">
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {session?.user?.name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-foreground">
              {session?.user?.name || "User"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate font-medium">
              Pro Member
            </p>
          </div>
          <Button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            variant="ghost"
            size="icon"
            className="text-muted-foreground h-8 w-8 hover:bg-red-500/10 hover:text-red-400 group"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-1" />
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
