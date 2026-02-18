"use client";

import { BarChart2, TrendingUp, Users, Zap } from "lucide-react";
import { Sidebar, DashboardHeader, EmptyState, KPICard } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const insightKPIs = [
  { label: "Market Match", value: "85%", icon: TrendingUp, trend: "+12% vs last month" },
  { label: "Peer Comparison", value: "Top 10%", icon: Users, trend: "in your role" },
  { label: "Skill Score", value: "720", icon: Zap, trend: "Strong profile" },
];

export default function InsightsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <DashboardHeader
          title="Skill Insights"
          description="AI-powered analysis of your career trajectory and skill gaps"
        />

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {insightKPIs.map((kpi, index) => (
            <KPICard key={kpi.label} {...kpi} index={index} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
           {/* Skill Gap Placeholder */}
           <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
           >
            <Card className="bg-white/5 border-white/10 backdrop-blur-md h-full">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-primary" />
                  Technical Skill Gaps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={Zap}
                  title="Analysis Pending"
                  description="Run a Skill Gap Analysis agent mission to see your missing technical proficiencies."
                  action={{
                    label: "Begin Analysis",
                    icon: TrendingUp,
                    onClick: () => {
                      // Navigate to missions
                      window.location.href = "/dashboard/missions";
                    }
                  }}
                />
              </CardContent>
            </Card>
           </motion.div>

           {/* Market Trends Placeholder */}
           <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
           >
            <Card className="bg-white/5 border-white/10 backdrop-blur-md h-full">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  Market Demand Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                   <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                      <BarChart2 className="w-8 h-8 text-purple-400" />
                   </div>
                   <h3 className="text-xl font-semibold text-white mb-2">Market Data Inbound</h3>
                   <p className="text-muted-foreground max-w-xs">
                     We are aggregating salary data and hiring trends for your target roles.
                   </p>
                </div>
              </CardContent>
            </Card>
           </motion.div>
        </div>
      </main>
    </div>
  );
}
