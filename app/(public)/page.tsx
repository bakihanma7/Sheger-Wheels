import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { FeaturedCars } from "@/components/landing/FeaturedCars";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Trust } from "@/components/landing/Trust";
import { NextSteps } from "@/components/landing/NextSteps";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: { absolute: `${BRAND.name} · Rent a car from someone nearby in ${BRAND.city}` },
  description: `Browse cars from local owners in ${BRAND.city}, request a trip and pay with a mock checkout. A frontend-only demo marketplace.`,
  alternates: { canonical: "/" },
  openGraph: { url: "/", title: `${BRAND.name} · Peer-to-peer car rental`, description: BRAND.tagline },
};

// Static page: the shell is prerendered; demo data is read in the browser after hydration.
export default function LandingPage() {
  return (
    <>
      <Hero />
      <FeaturedCars />
      <HowItWorks />
      <Trust />
      <NextSteps />
    </>
  );
}
