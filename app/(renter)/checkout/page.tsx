"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Receipt } from "@/components/bookings/Receipt";
import { Button } from "@/components/ui/Button";
import { CarImage } from "@/components/ui/CarImage";
import { EmptyState, Loading, Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { computeTotals, createBookingRequest, validateBookingRequest } from "@/lib/domain";
import { daysBetween, formatDateRange } from "@/lib/format";
import { useCars, useCheckoutDraft, useHydrated, useSession } from "@/lib/hooks";
import { KEYS, removeStorage } from "@/lib/storage";

export default function CheckoutPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { user } = useSession();
  const draft = useCheckoutDraft();
  const cars = useCars();
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  if (!hydrated || (cars.length === 0 && draft)) return <div className="page"><Loading /></div>;
  if (!draft)
    return (
      <div className="page page--mid">
        <EmptyState title="Nothing to check out" action={<Link href="/cars" className="btn btn--primary">Browse cars</Link>}>Pick a car and dates first, then come back here to review and pay (demo).</EmptyState>
      </div>
    );

  const car = cars.find((c) => c.id === draft.carId);
  const check = validateBookingRequest(draft);
  const days = daysBetween(draft.startDate, draft.endDate);
  const totals = car ? computeTotals(car.pricePerDay, days > 0 ? days : 0) : null;

  function pay() {
    setError("");
    setPaying(true);
    // Simulated processing delay so the pending state is visible. No network call happens.
    setTimeout(() => {
      const r = createBookingRequest(user?.id ?? null, draft!);
      setPaying(false);
      if (!r.ok) return setError(r.error);
      removeStorage(KEYS.checkoutDraft, "session");
      router.replace(`/checkout/success?booking=${encodeURIComponent(r.data.id)}`);
    }, 700);
  }

  return (
    <div className="page stack">
      <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/cars">Cars</Link> / Checkout</nav>
      <PageHeader title="Review and pay (demo)" sub="Check your trip, then complete the pretend payment." />
      <Notice tone="warn" title="Mock payment.">No real money moves and no payment details are collected. The owner still has to approve your request.</Notice>
      <div className="split split--wide-aside">
        <section className="panel stack" aria-labelledby="pay">
          <h2 id="pay" className="h2">Demo TeleBirr payment</h2>
          <p>Paying as <strong>{user?.name}</strong>. Your total is held (pretend) until the owner responds. If they decline, it's refunded.</p>
          <div className="notice">
            <p><strong>What happens when you press the button</strong></p>
            <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
              <li>A request is created with status “requested”.</li>
              <li>A clearly fake transaction reference (TB-DEMO-…) is generated.</li>
              <li>You can cancel the request any time before the pickup date.</li>
            </ul>
          </div>
          {!check.ok && <Notice tone="error" title="This trip can no longer be booked.">{check.error} <Link href={car ? `/cars/${car.id}` : "/cars"}><u>Choose different dates</u></Link>.</Notice>}
          {error && <Notice tone="error">{error}</Notice>}
          <div className="row">
            <Button variant="amber" onClick={pay} disabled={!check.ok || paying}>{paying ? "Processing demo payment…" : "Complete demo payment"}</Button>
            <Button variant="ghost" onClick={() => { removeStorage(KEYS.checkoutDraft, "session"); router.push(car ? `/cars/${car.id}` : "/cars"); }}>Cancel</Button>
          </div>
        </section>
        <aside className="panel stack" aria-labelledby="summary">
          <h2 id="summary" className="h2">Your trip</h2>
          {car ? (
            <>
              <div className="car-card__img" style={{ borderRadius: 12, overflow: "hidden" }}><CarImage src={car.photos[0]} alt={`${car.make} ${car.model}`} sizes="420px" /></div>
              <div>
                <p className="h3">{car.year} {car.make} {car.model}</p>
                <p className="muted">{formatDateRange(draft.startDate, draft.endDate)} · ⌖ {car.neighbourhood}</p>
              </div>
              {totals && <Receipt totals={totals} days={days} pricePerDay={car.pricePerDay} />}
            </>
          ) : <Notice tone="error">That car no longer exists.</Notice>}
        </aside>
      </div>
    </div>
  );
}
