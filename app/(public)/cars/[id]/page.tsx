import type { Metadata } from "next";
import { CarDetailClient } from "@/components/cars/CarDetailClient";
import { seedCars } from "@/lib/seed";
import { BRAND, SITE_URL } from "@/lib/brand";

/**
 * Rendering strategy: the seeded cars are pre-rendered (static) so metadata + JSON-LD exist for them.
 * User-created cars live only in the visitor's localStorage, so those ids render on demand with
 * generic metadata and the client component loads the record in the browser. See STRATEGY.md.
 */
export function generateStaticParams() {
  return seedCars().filter((c) => c.status === "approved").map((c) => ({ id: c.id }));
}

const seedCar = (id: string) => seedCars().find((c) => c.id === id && c.status === "approved");

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const car = seedCar(id);
  if (!car) return { title: "Car details", robots: { index: false } };
  const title = `${car.year} ${car.make} ${car.model} in ${car.neighbourhood}`;
  const description = `${car.make} ${car.model} (${car.transmission}, ${car.seats} seats) from ETB ${car.pricePerDay.toLocaleString("en-US")} per day in ${car.neighbourhood}, ${BRAND.city}. Demo listing.`;
  return {
    title,
    description,
    alternates: { canonical: `/cars/${car.id}` },
    openGraph: { type: "website", url: `/cars/${car.id}`, title, description, images: [{ url: car.photos[0], width: 800, height: 480, alt: title }] },
  };
}

export default async function CarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const car = seedCar(id);
  // Truthful structured data only: no ratings or review counts are invented.
  const jsonLd = car && {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${car.year} ${car.make} ${car.model}`,
    description: car.description,
    image: `${SITE_URL}${car.photos[0]}`,
    category: "Car rental (demo listing)",
    offers: { "@type": "Offer", price: car.pricePerDay, priceCurrency: "ETB", availability: "https://schema.org/InStock", url: `${SITE_URL}/cars/${car.id}` },
  };
  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <CarDetailClient id={id} />
    </>
  );
}
