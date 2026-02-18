"use client";

import { motion, useMotionValue, useSpring, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, Briefcase, CheckSquare, Clock, Bot, FileText } from "lucide-react";
import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats";

interface KPICardProps {
  label: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
  trend: string;
  index?: number;
}

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 60, damping: 20 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animate(motionValue, value, { duration: 1.5, ease: "easeOut" });
  }, [value, motionValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      setDisplayValue(Math.floor(latest));
    });
  }, [springValue]);

  return <span>{displayValue}</span>;
}

export function KPICard({ label, value, suffix = "", icon: Icon, trend, index = 0 }: KPICardProps) {
  const pct = Math.min(value > 0 ? 70 + index * 5 : 0, 100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="h-full"
    >
      <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 group hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 h-full relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon className="w-16 h-16 text-white" />
        </div>
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider">{label}</p>
            <div className="text-4xl font-extrabold tracking-tight text-white flex items-baseline gap-1">
              <AnimatedNumber value={value} />
              <span className="text-xl font-bold text-muted-foreground">{suffix}</span>
            </div>
          </div>
          
          <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${pct}%` }}
               transition={{ delay: 1 + index * 0.1, duration: 1 }}
               className="h-full bg-gradient-to-r from-primary to-purple-500"
             />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function KPIStrip() {
  const { stats, loading } = useDashboardStats();

  const kpis: KPICardProps[] = [
    {
      label: "Jobs Found",
      value: stats?.jobs_found ?? 0,
      suffix: "",
      icon: Briefcase,
      trend: stats?.jobs_found ? `${stats.jobs_found} total` : "—",
    },
    {
      label: "AI Resumes",
      value: stats?.resumes_generated ?? 0,
      suffix: "",
      icon: FileText,
      trend: stats?.resumes_generated ? `${stats.resumes_generated} total` : "—",
    },
    {
      label: "Apps Sent",
      value: stats?.applications_sent ?? 0,
      suffix: "",
      icon: CheckSquare,
      trend: stats?.applications_sent ? `${stats.applications_sent} total` : "—",
    },
    {
      label: "Time Saved",
      value: stats?.time_saved_hrs ?? 0,
      suffix: "hrs",
      icon: Clock,
      trend: stats?.active_missions ? `${stats.active_missions} active` : "—",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpis.map((kpi, index) => (
        <KPICard key={kpi.label} {...kpi} index={index} />
      ))}
    </div>
  );
}
