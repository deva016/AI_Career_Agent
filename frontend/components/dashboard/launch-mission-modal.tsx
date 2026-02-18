"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Search, MapPin, Briefcase, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LaunchMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunch: (params: {
    query: string;
    target_roles: string[];
    target_locations: string[];
  }) => Promise<void>;
  isLaunching: boolean;
}

export function LaunchMissionModal({
  isOpen,
  onClose,
  onLaunch,
  isLaunching,
}: LaunchMissionModalProps) {
  const [query, setQuery] = useState("");
  const [roles, setRoles] = useState("");
  const [locations, setLocations] = useState("Remote");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    await onLaunch({
      query,
      target_roles: roles.split(",").map((r) => r.trim()).filter(Boolean),
      target_locations: locations.split(",").map((l) => l.trim()).filter(Boolean),
    });
    
    // Reset and close on success is handled by parent but we can clear local state
    if (!isLaunching) {
       setQuery("");
       setRoles("");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto backdrop-blur-xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-primary/10 to-purple-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">New Discovery Mission</h2>
                    <p className="text-xs text-muted-foreground font-medium">Configure your autonomous job hunters</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="query" className="flex items-center gap-2 text-sm font-bold text-slate-300 uppercase tracking-wider opacity-70">
                    <Search className="w-3.5 h-3.5" />
                    Focus Keywords
                  </Label>
                  <Input
                    id="query"
                    placeholder="e.g. Senior React Developer, Node.js Engineer"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 focus:border-primary/50 h-12 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roles" className="flex items-center gap-2 text-sm font-bold text-slate-300 uppercase tracking-wider opacity-70">
                    <Briefcase className="w-3.5 h-3.5" />
                    Target Job Titles
                  </Label>
                  <Input
                    id="roles"
                    placeholder="e.g. Frontend Engineer, Fullstack (comma separated)"
                    value={roles}
                    onChange={(e) => setRoles(e.target.value)}
                    className="bg-white/5 border-white/10 focus:border-primary/50 h-12 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locations" className="flex items-center gap-2 text-sm font-bold text-slate-300 uppercase tracking-wider opacity-70">
                    <MapPin className="w-3.5 h-3.5" />
                    Preferred Locations
                  </Label>
                  <Input
                    id="locations"
                    placeholder="e.g. Remote, Berlin, New York"
                    value={locations}
                    onChange={(e) => setLocations(e.target.value)}
                    className="bg-white/5 border-white/10 focus:border-primary/50 h-12 text-white placeholder:text-slate-500"
                  />
                </div>

                {/* Info Card */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-3">
                  <Target className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Agents will scrape LinkedIn and other sources, analyze JDs for skill match, 
                    and rank based on your profile before populating your jobs board.
                  </p>
                </div>

                {/* Active/Submit Footer */}
                <div className="pt-2 flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="flex-1 border border-white/5 hover:bg-white/5"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-[2] bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-lg shadow-primary/20"
                    disabled={isLaunching || !query}
                  >
                    {isLaunching ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Initializing Agents...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Launch Agents
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
