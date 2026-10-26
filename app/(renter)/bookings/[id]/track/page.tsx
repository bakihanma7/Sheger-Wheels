"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookingActions } from "@/components/bookings/BookingActions";
import { useOwnedBooking } from "@/components/bookings/useOwnedBooking";
import { CarMap } from "@/components/cars/CarMap";
import { Button } from "@/components/ui/Button";
import { EmptyState, Loading, Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { BookingBadge } from "@/components/ui/Badge";

const STEPS = ["Picked up from the host", "Heading out of the city", "Scenic stop", "Heading back", "Arrived at return point"];

export default function TrackPage() {
  const { booking, car, user, status } = useOwnedBooking();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  // A small route of predefined sample points near the car's seeded location. Not GPS.
  const points = useMemo(() => {
    if (!car) return [];
    const { latitude: a, longitude: b } = car;
    return [[0, 0], [0.012, 0.01], [0.026, 0.022], [0.012, 0.03], [0, 0.004]].map(([dy, dx], i) => ({ lat: a + dy, lng: b + dx, label: STEPS[i] }));
  }, [car]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setStep((s) => (s < STEPS.length - 1 ? s + 1 : s)), 2500);
    return () => clearInterval(t);
  }, [playing]);
  useEffect(() => { if (step >= STEPS.length - 1) setPlaying(false); }, [step]);

  if (status === "loading") return <div className="page"><Loading /></div>;
  if (status !== "ok" || !booking || !user || booking.renterId !== user.id || !car)
    return <div className="page page--mid"><Notice tone="error" title="Not available.">This booking doesn't exist or isn't yours.</Notice></div>;
  if (booking.status !== "in_progress")
    return (
      <div className="page page--mid">
        <EmptyState title="Tracking isn't available yet" action={<Link href={`/bookings/${booking.id}`} className="btn btn--primary">Back to booking</Link>}>
          The simulated tracker only appears while a rental is in progress. This booking is {booking.status.replace("_", " ")}.
        </EmptyState>
      </div>
    );

  return (
    <div className="page stack">
      <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/bookings">My bookings</Link> / <Link href={`/bookings/${booking.id}`}>{car.make} {car.model}</Link> / Tracking</nav>
      <PageHeader title="Trip tracking" sub={<><span className="sim-label">Simulation</span> The marker moves between a few sample points. Nothing here is a real vehicle location.</>} actions={<BookingBadge status={booking.status} />} />
      <Notice tone="warn" title="This is a simulation.">The car is not being GPS-tracked. Use the controls below to step through an example trip.</Notice>
      <div className="split split--wide-aside">
        <div className="stack">
          <CarMap points={points} active={step} showRoute zoom={13} label={`Simulated trip marker at step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`} fallback={`${STEPS[step]} (step ${step + 1} of ${STEPS.length}), near ${car.neighbourhood}`} />
          <div className="row">
            <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>‹ Previous point</Button>
            <Button variant="primary" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} disabled={step >= STEPS.length - 1}>Next point ›</Button>
            <Button variant="secondary" onClick={() => setPlaying((p) => !p)} disabled={step >= STEPS.length - 1}>{playing ? "Pause" : "Auto-play"}</Button>
            <Button variant="ghost" onClick={() => { setStep(0); setPlaying(false); }}>Restart</Button>
          </div>
        </div>
        <aside className="stack">
          <section className="panel stack" aria-labelledby="glance">
            <h2 id="glance" className="h2">Your trip at a glance</h2>
            <ol className="timeline">
              {STEPS.map((s, i) => (
                <li key={s} data-done={i <= step} data-current={i === step}>
                  <span className="dot" aria-hidden="true" /><span>{s}{i === step && <span className="sr-only"> (current)</span>}</span>
                </li>
              ))}
            </ol>
          </section>
          <section className="panel stack" aria-labelledby="return">
            <h2 id="return" className="h2">Return information</h2>
            <p>Return {car.make} {car.model} at {car.neighbourhood} on the agreed date.</p>
            <BookingActions booking={booking} only={["complete", "dispute"]} />
          </section>
        </aside>
      </div>
    </div>
  );
}
