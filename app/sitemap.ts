import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/brand";
import { seedCars } from "@/lib/seed";

// Public routes + the seeded car pages. Cars created in a visitor's browser can't be listed here.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ["", "/cars", "/signin", "/signup"].map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now }));
  const cars = seedCars().filter((c) => c.status === "approved").map((c) => ({ url: `${SITE_URL}/cars/${c.id}`, lastModified: now }));
  return [...staticRoutes, ...cars];
}
