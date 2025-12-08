import { HeroSection } from "@/components/sections/HeroSection";
import { Navbar } from "@/components/sections/navbar";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { UseCasesSection } from "@/components/sections/UseCasesSection";
import { CTABanner } from "@/components/sections/CTABanner";

export function meta() {
  return [
    { title: "Vibecape - AI 驱动的本地文档编辑器" },
    {
      name: "description",
      content:
        "本地优先的 AI 文档编辑器，支持多种 AI 模型，为每个项目定制 AI 上下文。",
    },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <UseCasesSection />
      <CTABanner />
    </div>
  );
}
