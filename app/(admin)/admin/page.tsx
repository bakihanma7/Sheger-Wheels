"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CountBarChart, VolumeBarChart } from "@/components/charts/Charts";
import { EmptyState } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatETB, titleCase } from "@/lib/format";
import { useBookings, useCars, useDisputes, useUsers } from "@/lib/hooks";
import { adminStats } from "@/lib/selectors";

export default function AdminOverviewPage() {
  const users = useUsers();
  const cars = useCars();
  const bookings = useBookings();
  const disputes = useDisputes();
  const s = useMemo(() => adminStats(users, cars, bookings, disputes), [users, cars, bookings, disputes]);
  return (
    <div className="stack">
      <PageHeader eyebrow="Admin" title="Platform overview" sub="Everything below is computed from demo data in this browser." />
      <section className="grid-4" aria-label="Key numbers">
        <div className="metric"><span className="metric__label">Users</span><span className="metric__value">{s.totalUsers}</span><span className="metric__hint">{s.activeUsers} active</span></div>
        <div className="metric"><span className="metric__label">Cars approved</span><span className="metric__value">{s.approvedCars}</span><span className="metric__hint">{s.pendingCars ? <Link href="/admin/listings"><u>{s.pendingCars} pending review</u></Link> : "None pending"}</span></div>
        <div className="metric"><span className="metric__label">Booking volume</span><span className="metric__value">{formatETB(s.bookingVolume)}</span><span className="metric__hint">Paid bookings (demo)</span></div>
        <div className="metric"><span className="metric__label">Mock platform fee</span><span className="metric__value">{formatETB(s.platformFee)}</span><span className="metric__hint">{s.openDisputes ? <Link href="/admin/disputes"><u>{s.openDisputes} open dispute{s.openDisputes === 1 ? "" : "s"}</u></Link> : "No open disputes"}</span></div>
      </section>
      <div className="grid-2">
        <section className="panel">{s.byStatus.length ? <CountBarChart title="Bookings by status" data={s.byStatus.map((x) => ({ label: titleCase(x.status), value: x.count }))} /> : <EmptyState title="No bookings yet" />}</section>
        <section className="panel">{s.volumeByMonth.length ? <VolumeBarChart title="Monthly booking volume" data={s.volumeByMonth} /> : <EmptyState title="No paid bookings yet" />}</section>
      </div>
    </div>
  );
}
