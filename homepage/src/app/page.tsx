"use client";

import { HeroSection } from "@/components/sections/HeroSection";
import { Navbar } from "@/components/sections/navbar";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { LogosRow } from "@/components/sections/LogosRow";
import { CTABanner } from "@/components/sections/CTABanner";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <LogosRow />
      <HowItWorksSection />
      <CTABanner />
    </div>
  );
}
