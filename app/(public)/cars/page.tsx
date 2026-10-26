import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogueClient } from "@/components/cars/CatalogueClient";
import { Loading } from "@/components/ui/Notice";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Browse cars",
  description: `Search, filter and sort demo cars from local owners in ${BRAND.city}.`,
  alternates: { canonical: "/cars" },
};

export default function CarsPage() {
  return (
    <div className="page stack">
      <div>
        <h1 className="page-title">Find your car in {BRAND.city}</h1>
        <p className="page-sub">Search by make or model, narrow by price and neighbourhood, or check your dates.</p>
      </div>
      <Suspense fallback={<Loading label="Loading catalogue…" rows={5} />}>
        <CatalogueClient />
      </Suspense>
    </div>
  );
}
