import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source.
  transpilePackages: ['@madplan/legal', '@madplan/domain', '@madplan/checkout'],
  // No third-party images anywhere (brief §0). Own assets only.
  images: { unoptimized: true },
  // The repo root CLAUDE.md is the single source of agent rules; don't generate per-app copies.
  agentRules: false,
};

export default nextConfig;
