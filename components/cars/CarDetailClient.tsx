"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { CarMap } from "./CarMap";
import { Receipt } from "@/components/bookings/Receipt";
import { Button } from "@/components/ui/Button";
import { CarBadge } from "@/components/ui/Badge";
import { CarImage } from "@/components/ui/CarImage";
import { Field } from "@/components/ui/Field";
import { EmptyState, Loading, Notice } from "@/components/ui/Notice";
import { Stars } from "@/components/ui/Stars";
import { computeTotals, isCarPublic, validateBookingRequest, validateDates } from "@/lib/domain";
import { hasRole } from "@/lib/auth";
import { addDays, daysBetween, formatDate, formatETB, todayISO } from "@/lib/format";
import { useBookings, useCars, useHydrated, useReviews, useSession, useUsers } from "@/lib/hooks";
import { KEYS, writeStorage } from "@/lib/storage";
import { carRating, tripCount } from "@/lib/selectors";

export function CarDetailClient({ id }: { id: string }) {
  const hydrated = useHydrated();
  const cars = useCars();
  const users = useUsers();
  const bookings = useBookings();
  const allReviews = useReviews();
  const session = useSession();
  const router = useRouter();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState("");

  const car = cars.find((c) => c.id === id) ?? null;
  const owner = users.find((u) => u.id === car?.ownerId);
  const reviews = useMemo(() => allReviews.filter((r) => r.carId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [allReviews, id]);

  if (!hydrated || (cars.length === 0 && !car)) return <div className="page"><Loading label="Loading car…" rows={5} /></div>;
  if (!car)
    return (
      <div className="page page--mid">
        <EmptyState title="We couldn't find that car" action={<Link href="/cars" className="btn btn--primary">Browse cars</Link>}>
          It may have been removed, or the link is wrong.
        </EmptyState>
      </div>
    );

  const viewer = session.user;
  const isOwnerView = !!viewer && (viewer.id === car.ownerId || hasRole(viewer, "admin"));
  if (!isCarPublic(car) && !isOwnerView)
    return (
      <div className="page page--mid">
        <EmptyState title="This listing isn't available" action={<Link href="/cars" className="btn btn--primary">Browse cars</Link>}>
          It hasn't been approved yet, or the owner has deactivated it.
        </EmptyState>
      </div>
    );

  const rating = carRating(car.id, allReviews);
  const dateErr = start || end ? validateDates(start, end) : null;
  const days = !dateErr && start && end ? daysBetween(start, end) : 0;
  const totals = days ? computeTotals(car.pricePerDay, days) : null;
  const isMine = viewer?.id === car.ownerId;

  function onContinue() {
    setError("");
    const v = validateBookingRequest({ carId: car!.id, startDate: start, endDate: end });
    if (!v.ok) return setError(v.error);
    if (isMine) return setError("You can't book your own car.");
    // Draft lives in sessionStorage only; signed-out visitors are redirected to /signin?next=/checkout by the route guard.
    writeStorage(KEYS.checkoutDraft, { carId: car!.id, startDate: start, endDate: end }, "session");
    router.push("/checkout");
  }

  return (
    <div className="page stack">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/cars">Cars</Link> / {car.make} {car.model}
      </nav>
      {!isCarPublic(car) && (
        <Notice tone="warn" title="Preview.">
          This listing is <CarBadge status={car.status} /> and isn't visible to the public.
        </Notice>
      )}
      <div>
        <h1 className="page-title">{car.year} {car.make} {car.model}</h1>
        <p className="page-sub">
          ⌖ {car.neighbourhood}, {car.city} · {rating.average !== null ? <><Stars value={rating.average} /> {rating.average.toFixed(2)} ({rating.count})</> : "New listing, no reviews yet"}
        </p>
      </div>

      <div className="gallery">
        <div className="gallery__main"><CarImage src={car.photos[0]} alt={`${car.make} ${car.model} exterior`} priority sizes="(max-width: 1100px) 100vw, 800px" /></div>
        <div className="gallery__side">
          {car.photos.slice(1, 3).map((p, i) => (
            <div key={p + i}><CarImage src={p} alt={`${car.make} ${car.model} photo ${i + 2}`} sizes="400px" /></div>
          ))}
        </div>
      </div>

      <div className="split">
        <div className="stack">
          <section className="panel stack stack--sm" aria-label="Host">
            <div className="row">
              <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--c-brand)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 600 }}>
                {(owner?.name ?? "?").split(" ").map((s) => s[0]).slice(0, 2).join("")}
              </span>
              <div>
                <p className="h3">Hosted by {owner?.name ?? "a local owner"}</p>
                <p className="muted small">✓ Verified demo host · {tripCount(car.id, bookings)} completed trip{tripCount(car.id, bookings) === 1 ? "" : "s"}</p>
              </div>
            </div>
          </section>
          <section aria-label="Specifications">
            <h2 className="h2">Specifications</h2>
            <dl className="spec-list panel" style={{ marginTop: 12 }}>
              <div><dt>Year</dt><dd>{car.year}</dd></div>
              <div><dt>Transmission</dt><dd>{car.transmission}</dd></div>
              <div><dt>Fuel</dt><dd>{car.fuel}</dd></div>
              <div><dt>Seats</dt><dd>{car.seats}</dd></div>
            </dl>
          </section>
          <section aria-label="Description" className="stack stack--sm">
            <h2 className="h2">About this car</h2>
            <p>{car.description}</p>
          </section>
          <section aria-label="Pickup location" className="stack stack--sm">
            <h2 className="h2">Pickup location</h2>
            <CarMap points={[{ lat: car.latitude, lng: car.longitude, label: `${car.make} ${car.model}` }]} label={`Map showing the approximate pickup area in ${car.neighbourhood}`} fallback={`${car.neighbourhood}, ${car.city} (${car.latitude.toFixed(3)}, ${car.longitude.toFixed(3)})`} />
          </section>
          <section aria-label="Availability" className="stack stack--sm">
            <h2 className="h2">Availability</h2>
            <AvailabilityCalendar car={car} bookings={bookings} highlight={!dateErr && start && end ? { start, end } : undefined} />
          </section>
          <section aria-label="Reviews" className="stack stack--sm">
            <h2 className="h2">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="muted">No reviews yet. Reviews appear after a completed trip.</p>
            ) : (
              reviews.map((r) => (
                <article key={r.id} className="panel stack stack--sm">
                  <p><strong>{users.find((u) => u.id === r.renterId)?.name ?? "Renter"}</strong> <Stars value={r.rating} /> <span className="muted small">{formatDate(r.createdAt)}</span></p>
                  <p>{r.comment}</p>
                  {r.ownerReply && <p className="notice notice--info"><strong>Owner reply:</strong> {r.ownerReply}</p>}
                </article>
              ))
            )}
          </section>
        </div>

        <aside className="panel stack sticky" aria-label="Booking">
          <p><span className="price" style={{ fontSize: 28 }}>{formatETB(car.pricePerDay)}</span> <span className="muted">/ day</span></p>
          <Field id="start" label="Pickup date" type="date" min={todayISO()} value={start} onChange={(e) => { setStart(e.target.value); if (end && end <= e.target.value) setEnd(addDays(e.target.value, 1)); }} />
          <Field id="end" label="Return date" type="date" min={start ? addDays(start, 1) : todayISO()} value={end} onChange={(e) => setEnd(e.target.value)} />
          {(dateErr || error) && <p className="field__error" role="alert">{error || dateErr}</p>}
          {totals ? <Receipt totals={totals} days={days} pricePerDay={car.pricePerDay} /> : <p className="muted small">Choose dates to see your total before you book.</p>}
          {isMine ? (
            <Notice tone="info">This is your own listing, so booking is turned off.</Notice>
          ) : (
            <Button variant="amber" block onClick={onContinue} disabled={!isCarPublic(car)}>Request to book</Button>
          )}
          {session.status === "signed-out" && <p className="muted small">You'll be asked to sign in (demo accounts only) before checkout.</p>}
          <p className="muted small">Demo payment only: no real charge. Your request goes to the owner for approval.</p>
        </aside>
      </div>
    </div>
  );
}
