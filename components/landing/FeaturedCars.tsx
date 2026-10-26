"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { CarCard } from "@/components/cars/CarCard";
import { Loading } from "@/components/ui/Notice";
import { useBookings, useCars, useHydrated, useReviews } from "@/lib/hooks";
import { carRating, tripCount } from "@/lib/selectors";
import styles from "./landing.module.css";

export function FeaturedCars() {
  const hydrated = useHydrated();
  const cars = useCars();
  const bookings = useBookings();
  const reviews = useReviews();
  const featured = useMemo(() => cars.filter((c) => c.status === "approved").sort((a, b) => b.popularity - a.popularity).slice(0, 6), [cars]);

  return (
    <section className={styles.featured} aria-labelledby="featured-title">
      <div>
        <p className="eyebrow">Handpicked near you</p>
        <h2 id="featured-title" className={styles.sectionTitle}>A good drive is closer than you think.</h2>
        <p className={styles.sectionLead}>Thoughtfully cared-for cars. People who make you feel welcome.</p>
      </div>
      {!hydrated || (cars.length === 0 && hydrated) ? (
        <Loading label="Loading featured cars…" />
      ) : (
        <div className={styles.carGrid}>
          {featured.map((car, i) => (
            <CarCard key={car.id} car={car} rating={carRating(car.id, reviews)} trips={tripCount(car.id, bookings)} priority={i < 3} />
          ))}
        </div>
      )}
      <div>
        <Button href="/cars" variant="secondary">Browse all cars →</Button>
      </div>
    </section>
  );
}
