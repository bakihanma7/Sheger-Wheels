import Link from "next/link";
import type { Car } from "@/lib/types";
import { formatETB } from "@/lib/format";
import { CarImage } from "@/components/ui/CarImage";

export function CarCard({ car, rating, trips, priority }: { car: Car; rating: { average: number | null; count: number }; trips: number; priority?: boolean }) {
  return (
    <Link href={`/cars/${car.id}`} className="car-card">
      <div className="car-card__img">
        <CarImage src={car.photos[0]} alt={`${car.make} ${car.model}`} priority={priority} />
      </div>
      <div className="car-card__body">
        <p>
          <span className="car-card__name">
            {car.make} {car.model}
          </span>
          {"  "}
          {rating.average !== null ? `★ ${rating.average.toFixed(2)} (${rating.count})` : "New listing"}
        </p>
        <p>
          {car.year} · {car.seats} seats · {car.transmission} · {car.fuel}
        </p>
        <p>
          ⌖ {car.neighbourhood}, {car.city}
        </p>
        <p>
          <span className="price" style={{ fontSize: 20 }}>{formatETB(car.pricePerDay)}</span> / day　✓ Verified host · {trips} trip{trips === 1 ? "" : "s"} →
        </p>
      </div>
    </Link>
  );
}
