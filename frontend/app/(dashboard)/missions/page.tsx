/**
 * Missions Test Page
 * 
 * Test page for demonstrating the frontend-backend integration.
 */

"use client";

import { useState } from "react";
import { useMissions, useApproveMission } from "@/lib/hooks/use-missions";
import { agentClient } from "@/lib/api/agent-client";
import { MissionList } from "@/components/mission/mission-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Rocket, RefreshCw } from "lucide-react";

export default function MissionsTestPage() {
  const { missions, loading, error, refetch } = useMissions();
  const { approve } = useApproveMission();
  const { toast } = useToast();
  
  const [testQuery, setTestQuery] = useState("");
  const [launching, setLaunching] = useState(false);

  const handleLaunchJobFinder = async () => {
    setLaunching(true);
    try {
      const response = await agentClient.startJobFinder({
        query: testQuery || "Software Engineer",
        target_roles: ["Software Engineer", "Full Stack Developer"],
        target_locations: ["Remote", "San Francisco"],
      });
      
      toast({
        title: "Mission Launched! 🚀",
        description: `Job Finder started: ${response.mission_id.slice(0, 8)}...`,
      });
      
      // Refetch missions to show the new one
      setTimeout(refetch, 1000);
    } catch (err) {
      toast({
        title: "Launch Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLaunching(false);
    }
  };

  const handleApprove = async (missionId: string) => {
    try {
      await approve(missionId, true, "Looks good!");
      toast({
        title: "Mission Approved ✅",
        description: "The agent will continue execution.",
      });
      refetch();
    } catch (err) {
      toast({
        title: "Approval Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (missionId: string) => {
    try {
      await approve(missionId, false, "Needs revision");
      toast({
        title: "Mission Rejected ❌",
        description: "The agent execution was stopped.",
      });
      refetch();
    } catch (err) {
      toast({
        title: "Rejection Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Mission Control
          </h1>
          <p className="text-slate-400">Frontend-Backend Integration Test</p>
        </div>

        {/* Test Launch Card */}
        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-blue-400" />
              Launch Test Mission
            </CardTitle>
            <CardDescription>
              Test the Job Finder agent integration
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder="Enter job search query..."
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              className="bg-slate-950 border-slate-700"
            />
            <Button
              onClick={handleLaunchJobFinder}
              disabled={launching}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {launching ? "Launching..." : "Launch"}
            </Button>
          </CardContent>
        </Card>

        {/* Missions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-200">Active Missions</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="border-slate-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400">Error loading missions: {error}</p>
            </div>
          )}

          <MissionList
            missions={missions}
            loading={loading}
            onApprove={handleApprove}
            onReject={handleReject}
            onViewDetails={(id) => console.log("View details:", id)}
          />
        </div>
      </div>
    </div>
  );
}
