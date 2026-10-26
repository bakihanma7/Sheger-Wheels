"use client";

import Link from "next/link";
import { CarForm } from "@/components/owner/CarForm";
import { OwnedCarGate } from "@/components/owner/OwnedCarGate";
import { useOwnedCar } from "@/components/owner/useOwnedCar";
import { CarBadge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";

export default function EditCarPage() {
  const { car, status } = useOwnedCar();
  return (
    <div className="stack" style={{ maxWidth: 860 }}>
      <OwnedCarGate status={status}>
        {car && (
          <>
            <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/owner/cars">My cars</Link> / Edit</nav>
            <PageHeader title={`Edit ${car.make} ${car.model}`} actions={<CarBadge status={car.status} />} />
            <CarForm key={car.id} car={car} />
          </>
        )}
      </OwnedCarGate>
    </div>
  );
}
