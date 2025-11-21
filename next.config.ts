import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // ビルド時の型チェックを一時的にスキップ（開発中）
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
