"use client";

import { motion } from "framer-motion";
import { BarChart2, TrendingUp, Users, Zap, Target, Brain, ArrowUpRight, Award } from "lucide-react";
import { DashboardHeader, PageSkeleton, KPIStrip } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area
} from "recharts";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";


import { useInsights } from "@/lib/hooks/use-insights";

export default function InsightsPage() {
  const { data, loading, error } = useInsights();
  const { toast } = useToast();

  if (loading) return <PageSkeleton />;

  const skillData = data?.top_gaps.map(g => ({
    subject: g.skill,
    A: g.match,
    fullMark: 100
  })) || [
    { subject: 'Frontend', A: 80, fullMark: 100 },
    { subject: 'Backend', A: 70, fullMark: 100 },
    { subject: 'DevOps', A: 60, fullMark: 100 },
  ];

  const trendData = data?.market_trend || [
    { month: 'Jan', demand: 10 },
    { month: 'Feb', demand: 20 },
  ];

  const handleExplore = () => {
    toast({
      title: "Course Catalog Opening... 🚀",
      description: "Redirecting to specialized training tracks.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <DashboardHeader
        title="Skill Insights"
        description="Deep analysis of your market positioning and growth opportunities"
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Market Match", value: data?.stats?.market_match || "92%", icon: Award, color: "text-primary" },
          { label: "Skill Velocity", value: data?.stats?.skill_velocity || "+18%", icon: TrendingUp, color: "text-emerald-400" },
          { label: "Role Ranking", value: data?.stats?.role_ranking || "Top 5%", icon: Users, color: "text-purple-400" },
        ].map((item, i) => (
          <Card key={i} className="bg-white/5 border-white/10 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                 <div className={`p-2 rounded-lg bg-white/5 ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                 </div>
                 <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest leading-none mb-1">{item.label}</p>
              <h3 className="text-3xl font-extrabold text-white">{item.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar Chart */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Expertise Radar
            </CardTitle>
            <CardDescription className="text-muted-foreground/50">Your comparative strength across core disciplines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                  <PolarGrid stroke="#ffffff10" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                  <Radar
                    name="Skills"
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Area Chart */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Market Demand
            </CardTitle>
            <CardDescription className="text-muted-foreground/50">Hiring volume trends for Software Engineer roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff00" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="demand" stroke="#10b981" fillOpacity={1} fill="url(#colorDemand)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
         <Card className="lg:col-span-2 bg-white/5 border-white/10">
            <CardHeader>
               <CardTitle className="text-white">Active Skill Gaps</CardTitle>
               <CardDescription>Missing proficiencies based on target job descriptions</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                  {data?.top_gaps && data.top_gaps.length > 0 ? (
                    data.top_gaps.map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 group hover:border-primary/30 transition-colors">
                         <div className="w-2 h-2 rounded-full bg-primary" />
                         <div className="flex-1">
                            <h4 className="font-bold text-white text-sm">{item.skill}</h4>
                            <p className="text-[10px] text-muted-foreground uppercase">{item.match > 30 ? 'High Demand' : 'Trending'}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-xs font-bold text-white mb-1">{item.match}% Match</p>
                            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                               <div className="h-full bg-primary" style={{ width: `${item.match}%` }} />
                            </div>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No skill gaps identified yet. Run a Skill Gap Agent mission.
                    </div>
                  )}
                </div>
            </CardContent>
         </Card>
         <Card className="bg-primary shadow-2xl shadow-primary/20 border-white/10 text-white overflow-hidden relative">
            <div className="absolute -right-4 -top-4 p-4 opacity-20 transform rotate-12">
               <Zap className="w-40 h-40" />
            </div>
            <CardHeader className="relative z-10">
               <CardTitle>Level Up</CardTitle>
               <CardDescription className="text-white/70">Certified AI Career Path</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
               <p className="text-sm font-medium leading-relaxed">
                  Bridge your {Math.max(0, 100 - (data?.stats?.avg_match_score || 88))}% market gap by taking our recommended "Cloud Native Architecture" track.
               </p>
               <Button 
                onClick={handleExplore}
                className="w-full bg-white text-primary font-bold hover:bg-white/90"
               >
                  Explore Courses
               </Button>
            </CardContent>
         </Card>
      </div>
    </motion.div>
  );
}
