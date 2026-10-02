import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Signal Lycées",
    short_name: "Signal Lycées",
    description: "Signale anonymement un problème dans ton lycée et vois ce que les autres élèves remontent.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f3ec",
    theme_color: "#c2410c",
    lang: "fr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
