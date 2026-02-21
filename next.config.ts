import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-a21ce476cb4d425daad75109341f09df.r2.dev',
      },
    ],
  },
};

export default nextConfig;
