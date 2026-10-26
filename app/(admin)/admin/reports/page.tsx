"use client";

import { useMemo } from "react";
import { VolumeBarChart } from "@/components/charts/Charts";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { downloadCsv, toCsv } from "@/lib/csv";
import { formatETB, titleCase } from "@/lib/format";
import { useBookings, useCars, useDisputes, useHydrated, useSession, useUsers } from "@/lib/hooks";
import { adminStats } from "@/lib/selectors";
import { hasRole } from "@/lib/auth";

export default function AdminReportsPage() {
  useHydrated();
  const { user } = useSession();
  const users = useUsers();
  const cars = useCars();
  const bookings = useBookings();
  const disputes = useDisputes();
  const s = useMemo(() => adminStats(users, cars, bookings, disputes), [users, cars, bookings, disputes]);

  function exportBookings() {
    if (!hasRole(user, "admin")) return; // guard repeated in the action; only admins export platform data
    const name = (id: string) => users.find((u) => u.id === id)?.name ?? "";
    const car = (id: string) => { const c = cars.find((x) => x.id === id); return c ? `${c.make} ${c.model}` : ""; };
    downloadCsv("platform-bookings.csv", toCsv(bookings, [
      { header: "Booking id", value: (b) => b.id },
      { header: "Car", value: (b) => car(b.carId) },
      { header: "Renter", value: (b) => name(b.renterId) },
      { header: "Owner", value: (b) => name(b.ownerId) },
      { header: "Pickup", value: (b) => b.startDate },
      { header: "Return", value: (b) => b.endDate },
      { header: "Subtotal (ETB)", value: (b) => b.subtotal },
      { header: "Platform fee (ETB)", value: (b) => b.fee },
      { header: "Total (ETB)", value: (b) => b.total },
      { header: "Status", value: (b) => b.status },
      { header: "Payment", value: (b) => b.paymentStatus },
    ]));
  }

  return (
    <div className="stack">
      <PageHeader title="Reports" sub="Mock platform numbers computed from demo data." actions={<Button variant="secondary" onClick={exportBookings} disabled={bookings.length === 0}>Export bookings CSV</Button>} />
      <section className="grid-3">
        <div className="metric"><span className="metric__label">Booking volume</span><span className="metric__value">{formatETB(s.bookingVolume)}</span></div>
        <div className="metric"><span className="metric__label">Mock platform fee</span><span className="metric__value">{formatETB(s.platformFee)}</span></div>
        <div className="metric"><span className="metric__label">Open disputes</span><span className="metric__value">{s.openDisputes}</span></div>
      </section>
      <section className="panel">{s.volumeByMonth.length ? <VolumeBarChart title="Monthly booking volume" data={s.volumeByMonth} /> : <EmptyState title="No paid bookings yet" />}</section>
      <DataTable caption="Bookings by status" rows={s.byStatus} rowKey={(r) => r.status} empty={<EmptyState title="No bookings" />}
        columns={[{ key: "s", header: "Status", sortValue: (r) => r.status, render: (r) => titleCase(r.status) }, { key: "c", header: "Bookings", numeric: true, sortValue: (r) => r.count, render: (r) => r.count }]} />
    </div>
  );
}
