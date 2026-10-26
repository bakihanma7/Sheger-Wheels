"use client";

import { useMemo } from "react";
import { Stars } from "@/components/ui/Stars";
import { useBookings, useCars, useReviews, useUsers } from "@/lib/hooks";
import { formatDate } from "@/lib/format";
import styles from "./landing.module.css";

const benefits = [
  { title: "Verified local hosts", body: "Every listing is reviewed by an admin before it appears in search." },
  { title: "Clear from the start", body: "See your full trip price in birr up front, with the service fee shown separately." },
  { title: "A little help, anytime", body: "Raise an issue during a trip and an admin will review it with both sides." },
];

/** Numbers are computed from the demo data, not invented marketing figures. */
export function Trust() {
  const cars = useCars();
  const bookings = useBookings();
  const reviews = useReviews();
  const users = useUsers();
  const stats = useMemo(() => {
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
    return [
      { label: "Trips completed (demo)", value: String(bookings.filter((b) => ["completed", "reviewed", "resolved"].includes(b.status)).length), hint: "Across all demo cars" },
      { label: "Average review", value: avg ? `${avg.toFixed(1)} / 5` : "—", hint: `${reviews.length} review${reviews.length === 1 ? "" : "s"}` },
      { label: "Cars live", value: String(cars.filter((c) => c.status === "approved").length), hint: `${users.filter((u) => u.roles.includes("owner")).length} demo hosts` },
    ];
  }, [cars, bookings, reviews, users]);
  const shown = useMemo(() => [...reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 2), [reviews]);

  return (
    <section className={styles.trust} aria-labelledby="trust-title">
      <h2 id="trust-title" className={styles.sectionTitle}>Good people. Peace of mind.</h2>
      <div className={styles.trustGrid}>
        {benefits.map((b) => (
          <article key={b.title} className="panel">
            <h3>{b.title}</h3>
            <p>{b.body}</p>
          </article>
        ))}
      </div>
      <div className={styles.metrics}>
        {stats.map((m) => (
          <div key={m.label} className="metric">
            <span className="metric__label">{m.label}</span>
            <span className="metric__value">{m.value}</span>
            <span className="metric__hint">{m.hint}</span>
          </div>
        ))}
      </div>
      {shown.length > 0 && (
        <div className={styles.stories}>
          {shown.map((r) => {
            const car = cars.find((c) => c.id === r.carId);
            const who = users.find((u) => u.id === r.renterId);
            return (
              <article key={r.id} className="panel">
                <div className={styles.reviewHead}>
                  <p>
                    <span className={styles.reviewer}>{who?.name ?? "Renter"}</span> <Stars value={r.rating} />
                  </p>
                  <p className={styles.reviewMeta}>{car ? `${car.make} ${car.model}` : "Car"} · {formatDate(r.createdAt)}</p>
                </div>
                <p style={{ fontSize: 16, color: "var(--c-ink)" }}>{r.comment}</p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
