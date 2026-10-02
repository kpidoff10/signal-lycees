import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = publicEnv.siteUrl.replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/suivi/", "/signaler", "/api/", "/probleme/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
