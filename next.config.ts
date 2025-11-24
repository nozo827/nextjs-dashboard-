import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // TypeScript型チェックを有効化（セキュリティと品質向上のため）
    ignoreBuildErrors: false,
  },
  experimental: {
    // APIルートのボディサイズ制限を増やす（画像・動画アップロード用）
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
