"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AvailabilityCalendar } from "@/components/cars/AvailabilityCalendar";
import { OwnedCarGate } from "@/components/owner/OwnedCarGate";
import { useOwnedCar } from "@/components/owner/useOwnedCar";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { blockRange, setUnavailableDates } from "@/lib/domain";
import { formatDate, todayISO } from "@/lib/format";
import { useBookings } from "@/lib/hooks";

export default function AvailabilityPage() {
  const { car, user, status } = useOwnedCar();
  const bookings = useBookings();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  function toggle(date: string) {
    if (!car) return;
    const next = car.unavailableDates.includes(date) ? car.unavailableDates.filter((d) => d !== date) : [...car.unavailableDates, date];
    const r = setUnavailableDates(user?.id ?? null, car.id, next);
    setMsg(r.ok ? { tone: "success", text: `${formatDate(date)} is now ${next.includes(date) ? "blocked" : "available"}.` } : { tone: "error", text: r.error });
  }
  function apply(block: boolean) {
    if (!car) return;
    const r = blockRange(user?.id ?? null, car.id, start, end || start, block);
    setMsg(r.ok ? { tone: "success", text: block ? "Dates blocked." : "Dates unblocked." } : { tone: "error", text: r.error });
  }

  return (
    <div className="stack">
      <OwnedCarGate status={status}>
        {car && (
          <>
            <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/owner/cars">My cars</Link> / {car.make} {car.model} / Availability</nav>
            <PageHeader title="Availability" sub={`Block the days ${car.make} ${car.model} can't be rented. Booked days can't be edited here.`} />
            {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
            <div className="split">
              <section aria-label="Calendar" className="stack stack--sm">
                <AvailabilityCalendar car={car} bookings={bookings} mode="edit" onToggle={toggle} />
                <p className="muted small">Tip: press a day to block or unblock it. Changes are saved straight away.</p>
              </section>
              <form className="panel stack" onSubmit={(e: FormEvent) => e.preventDefault()} aria-label="Block or unblock a range" noValidate>
                <h2 className="h2">Block or unblock dates</h2>
                <Field id="from" label="From" type="date" min={todayISO()} value={start} onChange={(e) => setStart(e.target.value)} />
                <Field id="to" label="To (inclusive)" type="date" min={start || todayISO()} value={end} onChange={(e) => setEnd(e.target.value)} hint="Leave empty for a single day." />
                <Button variant="primary" onClick={() => apply(true)} disabled={!start}>Block these dates</Button>
                <Button variant="secondary" onClick={() => apply(false)} disabled={!start}>Unblock these dates</Button>
              </form>
            </div>
          </>
        )}
      </OwnedCarGate>
    </div>
  );
}
