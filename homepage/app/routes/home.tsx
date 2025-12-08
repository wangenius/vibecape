import { HeroSection } from "@/components/sections/HeroSection";
import { Navbar } from "@/components/sections/navbar";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { UseCasesSection } from "@/components/sections/UseCasesSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { LogosRow } from "@/components/sections/LogosRow";
import { CTABanner } from "@/components/sections/CTABanner";

export function meta() {
  return [
    { title: "vibecape - AI-Powered Creative Writing Studio" },
    {
      name: "description",
      content: "Transform your creative writing with AI-powered assistance.",
    },
  ];
}

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
