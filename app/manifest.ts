import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PeaceWorks",
    short_name: "PeaceWorks",
    description:
      "PeaceWorks helps leaders build cultures where trust holds under pressure.",
    start_url: "/my-dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f6f3ee",
    theme_color: "#5a7a5c",
    orientation: "any",
    icons: [
      {
        src: "/icons/peaceworks-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/peaceworks-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/peaceworks-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/peaceworks-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
