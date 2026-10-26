export const BRAND = {
  name: "Sheggar Wheels",
  short: "Sheggar",
  mark: "↗",
  city: "Addis Ababa",
  year: 2026,
  tagline: "Rent a car from someone nearby.",
};

/** Public site URL for canonical links, sitemap and metadataBase. Only a public, non-secret value. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
