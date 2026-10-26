import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BRAND, SITE_URL } from "@/lib/brand";
import { DemoBanner } from "@/components/layout/DemoBanner";

// Self-hosted at build time by next/font (no runtime request to Google).
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND.name} · Peer-to-peer car rental in ${BRAND.city}`, template: `%s · ${BRAND.name}` },
  description: `${BRAND.tagline} A demo marketplace for exploring car rental in ${BRAND.city}. No real payments, no live tracking.`,
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: `${BRAND.name} · Peer-to-peer car rental in ${BRAND.city}`,
    description: `${BRAND.tagline} A demo marketplace. No real payments.`,
    locale: "en_ET",
  },
  twitter: { card: "summary", title: BRAND.name, description: BRAND.tagline },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b5048" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
