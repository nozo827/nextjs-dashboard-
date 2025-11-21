import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // TypeScript型チェックを有効化（セキュリティと品質向上のため）
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
