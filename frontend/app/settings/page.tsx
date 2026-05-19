"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [roles, setRoles] = useState("");
  const [locations, setLocations] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();
        
        setName(data.name || session?.user?.name || "");
        setRoles(data.target_roles?.join(", ") || "");
        setLocations(data.target_locations?.join(", ") || "");
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Could not load settings");
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchSettings();
    }
  }, [session]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) throw new Error("Update failed");
      
      // Update session to reflect new name in UI
      await updateSession({ name });
      
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePrefs = async () => {
    setSavingPrefs(true);
    try {
      const payload = {
        target_roles: roles.split(",").map(r => r.trim()).filter(Boolean),
        target_locations: locations.split(",").map(l => l.trim()).filter(Boolean),
      };

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Update failed");
      
      toast.success("Job preferences updated");
    } catch (error) {
      toast.error("Failed to update preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  if (loading && !session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 px-4 md:px-0">
      <div className="max-w-4xl mx-auto py-8 md:py-12">
        <Link href="/dashboard">
          <Button variant="ghost" className="text-white mb-6 p-0 hover:bg-transparent hover:text-purple-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Settings</h1>

        <div className="space-y-8 pb-12">
          {/* Profile Section */}
          <section className="p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Save className="w-32 h-32 text-white" />
            </div>
            
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">Profile Details</h2>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 text-center sm:text-left">
              {session?.user?.image && (
                <div className="relative group">
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="w-24 h-24 rounded-full border-4 border-purple-500/20 shadow-2xl"
                  />
                  <div className="absolute inset-0 rounded-full bg-purple-500/10 blur-xl -z-10 group-hover:bg-purple-500/20 transition-colors" />
                </div>
              )}
              <div className="space-y-1 relative z-10">
                <p className="font-bold text-xl text-white">{session?.user?.name}</p>
                <p className="text-gray-400 text-sm md:text-base">{session?.user?.email}</p>
                <Badge variant="outline" className="mt-2 text-[10px] uppercase tracking-widest text-purple-400 border-purple-400/30">
                  Verified Account
                </Badge>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-white/80 text-sm">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-black/20 border-white/10 text-white h-11 focus:ring-purple-500/50"
                  placeholder="Your Name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-white/80 text-sm">Email Address</Label>
                <Input
                  id="email"
                  value={session?.user?.email || ""}
                  disabled
                  className="bg-black/20 border-white/10 text-white/50 h-11 cursor-not-allowed"
                />
              </div>
              <Button 
                onClick={handleSaveProfile}
                disabled={savingProfile || !name}
                className="w-full sm:w-auto px-8 bg-purple-600 hover:bg-purple-700 font-bold transition-all active:scale-95 shadow-lg shadow-purple-600/20"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
            </div>
          </section>

          {/* Job Preferences */}
          <section className="p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl relative overflow-hidden">
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">Job Search Preferences</h2>
            <div className="space-y-6 relative z-10">
              <div className="grid gap-2">
                <Label htmlFor="roles" className="text-white/80 text-sm">Target Roles</Label>
                <Input
                  id="roles"
                  value={roles}
                  onChange={(e) => setRoles(e.target.value)}
                  placeholder="e.g., Data Analyst, Data Scientist"
                  className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 h-11 focus:ring-purple-500/50"
                />
                <p className="text-[10px] text-gray-500">Separate multiple roles with commas</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location" className="text-white/80 text-sm">Preferred Locations</Label>
                <Input
                  id="location"
                  value={locations}
                  onChange={(e) => setLocations(e.target.value)}
                  placeholder="e.g., Remote, New York, San Francisco"
                  className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 h-11 focus:ring-purple-500/50"
                />
              </div>
              <Button 
                onClick={handleUpdatePrefs}
                disabled={savingPrefs}
                className="w-full sm:w-auto px-8 bg-purple-600 hover:bg-purple-700 font-bold transition-all active:scale-95 shadow-lg shadow-purple-600/20"
              >
                {savingPrefs ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Update Preferences
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
