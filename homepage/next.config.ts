import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX({
  configPath: "source.config.ts",
});

const nextConfig: NextConfig = {
  // Export as a fully static site so Vercel can use a static output directory
  output: "export",
  // next/image requires this when using static export
  images: { unoptimized: true },
};

export default withMDX(nextConfig);
