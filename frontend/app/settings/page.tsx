"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();

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

        <div className="space-y-8">
          {/* Profile Section */}
          <section className="p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl">
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
              <div className="space-y-1">
                <p className="font-bold text-xl text-white">{session?.user?.name}</p>
                <p className="text-gray-400 text-sm md:text-base">{session?.user?.email}</p>
                <Badge variant="outline" className="mt-2 text-[10px] uppercase tracking-widest text-purple-400 border-purple-400/30">
                  Verified Account
                </Badge>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-white/80 text-sm">Full Name</Label>
                <Input
                  id="name"
                  defaultValue={session?.user?.name || ""}
                  className="bg-black/20 border-white/10 text-white h-11 focus:ring-purple-500/50"
                  placeholder="Your Name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-white/80 text-sm">Email Address</Label>
                <Input
                  id="email"
                  defaultValue={session?.user?.email || ""}
                  disabled
                  className="bg-black/20 border-white/10 text-white/50 h-11 cursor-not-allowed"
                />
              </div>
              <Button className="w-full sm:w-auto px-8 bg-purple-600 hover:bg-purple-700 font-bold transition-all active:scale-95 shadow-lg shadow-purple-600/20">
                Save Changes
              </Button>
            </div>
          </section>

          {/* Job Preferences */}
          <section className="p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl">
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">Job Search Preferences</h2>
            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="roles" className="text-white/80 text-sm">Target Roles</Label>
                <Input
                  id="roles"
                  placeholder="e.g., Data Analyst, Data Scientist"
                  className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 h-11 focus:ring-purple-500/50"
                />
                <p className="text-[10px] text-gray-500">Separate multiple roles with commas</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location" className="text-white/80 text-sm">Preferred Locations</Label>
                <Input
                  id="location"
                  placeholder="e.g., Remote, New York, San Francisco"
                  className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 h-11 focus:ring-purple-500/50"
                />
              </div>
              <Button className="w-full sm:w-auto px-8 bg-purple-600 hover:bg-purple-700 font-bold transition-all active:scale-95 shadow-lg shadow-purple-600/20">
                Update Preferences
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
