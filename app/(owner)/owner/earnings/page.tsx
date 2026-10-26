"use client";

import { useMemo } from "react";
import { EarningsChart } from "@/components/charts/Charts";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { downloadCsv, toCsv } from "@/lib/csv";
import { formatETB } from "@/lib/format";
import { useBookings, useCars, useSession } from "@/lib/hooks";
import { FINISHED, ownerStats } from "@/lib/selectors";

export default function EarningsPage() {
  const { user } = useSession();
  const cars = useCars();
  const bookings = useBookings();
  const s = useMemo(() => (user ? ownerStats(cars, bookings, user.id) : null), [cars, bookings, user]);
  if (!user || !s) return null;

  const perCar = s.myCars.map((c) => {
    const done = s.mine.filter((b) => b.carId === c.id && FINISHED.includes(b.status));
    return { id: c.id, name: `${c.make} ${c.model}`, trips: done.length, days: done.reduce((n, b) => n + b.days, 0), earnings: done.reduce((n, b) => n + b.subtotal, 0) };
  });

  function exportCsv() {
    // Only this owner's own completed bookings.
    const rows = s!.mine.filter((b) => FINISHED.includes(b.status));
    downloadCsv("my-earnings.csv", toCsv(rows, [
      { header: "Booking id", value: (b) => b.id },
      { header: "Car", value: (b) => { const c = cars.find((x) => x.id === b.carId); return c ? `${c.make} ${c.model}` : ""; } },
      { header: "Pickup", value: (b) => b.startDate },
      { header: "Return", value: (b) => b.endDate },
      { header: "Days", value: (b) => b.days },
      { header: "Earnings (ETB)", value: (b) => b.subtotal },
      { header: "Status", value: (b) => b.status },
    ]));
  }

  return (
    <div className="stack">
      <PageHeader title="Earnings" sub="Completed trips only. The renter's service fee goes to the (mock) platform, not to you." actions={<Button variant="secondary" onClick={exportCsv} disabled={s.earningsByMonth.length === 0}>Export CSV</Button>} />
      <div className="metric" style={{ maxWidth: 320 }}><span className="metric__label">Total earnings</span><span className="metric__value">{formatETB(s.totalEarnings)}</span></div>
      <section className="panel">{s.earningsByMonth.length ? <EarningsChart data={s.earningsByMonth} /> : <EmptyState title="No earnings yet">Complete a trip to see monthly earnings here.</EmptyState>}</section>
      <DataTable caption="Per-car summary" rows={perCar} rowKey={(r) => r.id} empty={<EmptyState title="No cars yet" />} columns={[
        { key: "name", header: "Car", sortValue: (r) => r.name, render: (r) => r.name },
        { key: "trips", header: "Trips", numeric: true, sortValue: (r) => r.trips, render: (r) => r.trips },
        { key: "days", header: "Days rented", numeric: true, sortValue: (r) => r.days, render: (r) => r.days },
        { key: "earn", header: "Earnings", numeric: true, sortValue: (r) => r.earnings, render: (r) => formatETB(r.earnings) },
      ]} />
    </div>
  );
}
