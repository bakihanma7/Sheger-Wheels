"use client";

import { useMemo, useState } from "react";
import type { Booking, Car } from "@/lib/types";
import { BLOCKING_STATUSES } from "@/lib/domain";
import { addDays, eachDate, todayISO } from "@/lib/format";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Month grid. view mode = read-only; edit mode = each future day is a toggle button (owner blocks/unblocks).
 * Booked days come from confirmed / in-progress bookings only.
 */
export function AvailabilityCalendar({
  car,
  bookings,
  mode = "view",
  onToggle,
  highlight,
}: {
  car: Car;
  bookings: Booking[];
  mode?: "view" | "edit";
  onToggle?: (date: string) => void;
  highlight?: { start: string; end: string };
}) {
  const today = todayISO();
  const [cursor, setCursor] = useState(today.slice(0, 7));
  const [y, m] = cursor.split("-").map(Number);

  const booked = useMemo(() => {
    const s = new Set<string>();
    bookings.filter((b) => b.carId === car.id && BLOCKING_STATUSES.includes(b.status)).forEach((b) => eachDate(b.startDate, b.endDate).forEach((d) => s.add(d)));
    return s;
  }, [bookings, car.id]);
  const blocked = useMemo(() => new Set(car.unavailableDates), [car.unavailableDates]);
  const picked = useMemo(() => (highlight && highlight.end > highlight.start ? new Set(eachDate(highlight.start, highlight.end)) : new Set<string>()), [highlight]);

  const first = new Date(Date.UTC(y, m - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const title = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(first);
  const shift = (n: number) => setCursor(new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7));

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < lead; i++) cells.push(<div key={`e${i}`} className="cal-day cal-day--empty" aria-hidden="true" />);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${cursor}-${String(d).padStart(2, "0")}`;
    const state = date < today ? "past" : booked.has(date) ? "booked" : blocked.has(date) ? "blocked" : picked.has(date) ? "selected" : "free";
    const text = { past: "past", booked: "booked", blocked: "blocked by owner", selected: "selected", free: "available" }[state];
    const label = `${d} ${title}, ${text}`;
    if (mode === "edit" && state !== "past" && state !== "booked") {
      cells.push(
        <button key={date} type="button" className="cal-day" data-state={state} aria-pressed={blocked.has(date)} aria-label={`${label}. Press to ${blocked.has(date) ? "unblock" : "block"}.`} onClick={() => onToggle?.(date)}>
          {d}
        </button>,
      );
    } else {
      cells.push(
        <div key={date} className="cal-day" data-state={state} role="img" aria-label={label}>
          {d}
        </div>,
      );
    }
  }

  return (
    <div className="calendar">
      <div className="calendar__head">
        <button type="button" className="page-link" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
        <strong aria-live="polite">{title}</strong>
        <button type="button" className="page-link" onClick={() => shift(1)} aria-label="Next month">›</button>
      </div>
      <div className="calendar__grid">
        {DOW.map((d) => (
          <div key={d} className="calendar__dow" aria-hidden="true">{d}</div>
        ))}
        {cells}
      </div>
      <p className="legend" style={{ marginTop: 12 }}>
        <span><i style={{ background: "#fff" }} />Available</span>
        <span><i style={{ background: "#f0f0ee" }} />Blocked by owner</span>
        <span><i style={{ background: "#fff1d6" }} />Booked</span>
        {highlight && <span><i style={{ background: "var(--c-brand)" }} />Your dates</span>}
      </p>
    </div>
  );
}

export { addDays };
