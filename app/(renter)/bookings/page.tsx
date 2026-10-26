"use client";

import { useMemo, useState } from "react";
import { BookingsTable, bookingColumns } from "@/components/bookings/BookingsTable";
import { Button } from "@/components/ui/Button";
import { Field, SelectField } from "@/components/ui/Field";
import { EmptyState, Loading } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { downloadCsv, toCsv } from "@/lib/csv";
import { formatDate } from "@/lib/format";
import { useBookings, useCars, useHydrated, useSession, useUsers } from "@/lib/hooks";
import { paginate } from "@/lib/selectors";

const TABS = [
  ["all", "All"],
  ["upcoming", "Upcoming"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled & declined"],
] as const;

export default function BookingsPage() {
  const hydrated = useHydrated();
  const { user } = useSession();
  const cars = useCars();
  const users = useUsers();
  const bookings = useBookings();
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("all");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const mine = useMemo(() => bookings.filter((b) => b.renterId === user?.id), [bookings, user]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return mine.filter((b) => {
      const car = cars.find((c) => c.id === b.carId);
      if (tab === "upcoming" && !["requested", "confirmed", "in_progress"].includes(b.status)) return false;
      if (tab === "completed" && !["completed", "reviewed", "resolved"].includes(b.status)) return false;
      if (tab === "cancelled" && !["cancelled", "declined"].includes(b.status)) return false;
      if (status && b.status !== status) return false;
      if (needle && !`${car?.make} ${car?.model}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [mine, cars, tab, q, status]);

  // Reset to page 1 whenever a filter changes; paginate() also clamps.
  const view = paginate(filtered, page, 8);
  const cols = bookingColumns({ cars, users, href: (b) => `/bookings/${b.id}` });
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };

  function exportCsv() {
    if (!user) return;
    // Only the signed-in renter's own bookings are ever exported.
    const rows = bookings.filter((b) => b.renterId === user.id);
    const csv = toCsv(rows, [
      { header: "Booking id", value: (b) => b.id },
      { header: "Car", value: (b) => { const c = cars.find((x) => x.id === b.carId); return c ? `${c.make} ${c.model}` : ""; } },
      { header: "Pickup", value: (b) => b.startDate },
      { header: "Return", value: (b) => b.endDate },
      { header: "Days", value: (b) => b.days },
      { header: "Subtotal (ETB)", value: (b) => b.subtotal },
      { header: "Fee (ETB)", value: (b) => b.fee },
      { header: "Total (ETB)", value: (b) => b.total },
      { header: "Status", value: (b) => b.status },
      { header: "Payment", value: (b) => `${b.paymentStatus} (${b.paymentRef})` },
      { header: "Requested on", value: (b) => formatDate(b.createdAt) },
    ]);
    downloadCsv("my-bookings.csv", csv);
  }

  return (
    <div className="page stack">
      <PageHeader title="My bookings" sub="Every trip you've requested, with status and receipts." actions={<Button variant="secondary" onClick={exportCsv} disabled={mine.length === 0}>Export CSV</Button>} />
      <div className="tabs" role="tablist" aria-label="Booking groups">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" className="tab" aria-selected={tab === k} onClick={() => reset(setTab)(k)}>{label}</button>
        ))}
      </div>
      <form className="field-row" onSubmit={(e) => e.preventDefault()} aria-label="Filter bookings">
        <Field id="q" label="Search by car" value={q} onChange={(e) => reset(setQ)(e.target.value)} />
        <SelectField id="status" label="Status" value={status} onChange={(e) => reset(setStatus)(e.target.value)}>
          <option value="">Any</option>
          {["requested", "confirmed", "in_progress", "completed", "reviewed", "declined", "cancelled", "disputed", "resolved"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </SelectField>
      </form>
      {!hydrated ? <Loading /> : (
        <>
          <BookingsTable bookings={view.items} caption={`Bookings (${filtered.length})`} columns={cols} empty={<EmptyState title={mine.length === 0 ? "You have no bookings yet" : "No bookings match your filters"} action={mine.length === 0 ? <Button href="/cars" variant="primary">Browse cars</Button> : undefined}>{mine.length === 0 ? "Request a trip and it will show up here." : "Try a different tab, status or search."}</EmptyState>} />
          {filtered.length > 0 && <Pagination page={view.page} pages={view.pages} total={view.total} label="Booking pages" onPage={setPage} />}
        </>
      )}
    </div>
  );
}
