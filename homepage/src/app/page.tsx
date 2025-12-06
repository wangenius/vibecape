"use client";

import { HeroSection } from "@/components/sections/HeroSection";
import { Navbar } from "@/components/sections/navbar";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { UseCasesSection } from "@/components/sections/UseCasesSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { LogosRow } from "@/components/sections/LogosRow";
import { CTABanner } from "@/components/sections/CTABanner";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <LogosRow />
      <FeaturesSection />
      <UseCasesSection />
      <TestimonialsSection />
      <CTABanner />
    </div>
  );
}
