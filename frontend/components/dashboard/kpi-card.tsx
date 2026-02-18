"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend: string;
  index?: number;
}

export function KPICard({ label, value, icon: Icon, trend, index = 0 }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 group hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">{label}</p>
            <div className="p-2 rounded-full bg-white/5 group-hover:bg-primary/20 transition-colors">
              <Icon className="h-4 w-4 text-purple-400 group-hover:text-primary transition-colors" />
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-3">
            <div className="text-3xl font-bold tracking-tight text-white">{value}</div>
            <p className="text-xs text-gray-500 font-medium group-hover:text-gray-400 transition-colors">{trend}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
