import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/gilesemery/peaceworks-main/main/PeaceworksLogo.svg",
      },
    ],
  },
};

export default nextConfig;
