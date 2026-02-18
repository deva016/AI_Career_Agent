"use client";

import { NexusNavbar } from "@/components/landing/NexusNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { TimelineSteps } from "@/components/landing/TimelineSteps";
import { IntegrationsSection } from "@/components/landing/IntegrationsSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { SymbolSpaceBackground } from "@/components/landing/SymbolSpaceBackground";

export default function Home() {
  return (
    <div className="bg-black min-h-screen selection:bg-primary/30 selection:text-primary relative">
      {/* Background Layer */}
      <SymbolSpaceBackground />

      {/* Navigation */}
      <NexusNavbar />

      <main>
        {/* Hero Section with WebGL Shader */}
        <HeroSection />

        {/* Feature Grid (Bento Style) */}
        <BentoGrid />

        {/* Workflow Timeline */}
        <TimelineSteps />

        {/* Integrations Cloud */}
        <IntegrationsSection />

        {/* Final CTA & Footer */}
        <FinalCTA />
      </main>
    </div>
  );
}
