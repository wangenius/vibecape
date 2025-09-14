import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX({
  configPath: "source.config.ts",
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withMDX(nextConfig);
