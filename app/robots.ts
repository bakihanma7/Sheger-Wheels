import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/brand";

// Crawler guidance only, NOT access control. Private areas are also protected by in-app role guards (demo-level).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/bookings", "/checkout", "/owner", "/admin", "/signin", "/signup", "/checks"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
