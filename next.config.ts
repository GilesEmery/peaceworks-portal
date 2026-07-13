import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.peaceworks.network",
        pathname: "/PeaceworksLogo.svg",
      },
    ],
  },
};

export default nextConfig;
