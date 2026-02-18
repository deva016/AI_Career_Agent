"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/dashboard">
          <Button variant="ghost" className="text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <h1 className="text-4xl font-bold text-white mb-8">Settings</h1>

        {/* Profile Section */}
        <div className="mb-8 p-6 bg-white/10 backdrop-blur-xl rounded-lg border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Profile</h2>
          <div className="flex items-center gap-6 mb-6">
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt="Profile"
                className="w-20 h-20 rounded-full"
              />
            )}
            <div>
              <p className="font-semibold text-lg text-white">{session?.user?.name}</p>
              <p className="text-gray-300">{session?.user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white">Name</Label>
              <Input
                id="name"
                defaultValue={session?.user?.name || ""}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                defaultValue={session?.user?.email || ""}
                disabled
                className="bg-white/10 border-white/20 text-white opacity-50"
              />
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700">Save Changes</Button>
          </div>
        </div>

        {/* Job Preferences */}
        <div className="p-6 bg-white/10 backdrop-blur-xl rounded-lg border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Job Preferences</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="roles" className="text-white">Target Roles</Label>
              <Input
                id="roles"
                placeholder="e.g., Data Analyst, Data Scientist"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="location" className="text-white">Preferred Locations</Label>
              <Input
                id="location"
                placeholder="e.g., Remote, New York, San Francisco"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700">Update Preferences</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
