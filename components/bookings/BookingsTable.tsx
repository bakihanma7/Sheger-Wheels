"use client";

import Link from "next/link";
import type { Booking, Car, User } from "@/lib/types";
import { BookingBadge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { formatDate, formatETB } from "@/lib/format";

export function bookingColumns(opts: { cars: Car[]; users: User[]; href?: (b: Booking) => string; showRenter?: boolean; showOwner?: boolean }): Column<Booking>[] {
  const car = (id: string) => opts.cars.find((c) => c.id === id);
  const name = (id: string) => opts.users.find((u) => u.id === id)?.name ?? "Unknown";
  const cols: Column<Booking>[] = [
    { key: "car", header: "Car", sortValue: (b) => `${car(b.carId)?.make} ${car(b.carId)?.model}`, render: (b) => { const label = car(b.carId) ? `${car(b.carId)!.make} ${car(b.carId)!.model}` : "Removed car"; return opts.href ? <Link href={opts.href(b)}><u>{label}</u></Link> : label; } },
  ];
  if (opts.showRenter) cols.push({ key: "renter", header: "Renter", sortValue: (b) => name(b.renterId), render: (b) => name(b.renterId) });
  if (opts.showOwner) cols.push({ key: "owner", header: "Owner", sortValue: (b) => name(b.ownerId), render: (b) => name(b.ownerId) });
  cols.push(
    { key: "dates", header: "Dates", sortValue: (b) => b.startDate, render: (b) => `${formatDate(b.startDate)} → ${formatDate(b.endDate)}` },
    { key: "days", header: "Days", numeric: true, sortValue: (b) => b.days, render: (b) => b.days },
    { key: "total", header: "Total", numeric: true, sortValue: (b) => b.total, render: (b) => formatETB(b.total) },
    { key: "status", header: "Status", sortValue: (b) => b.status, render: (b) => <BookingBadge status={b.status} /> },
  );
  return cols;
}

export function BookingsTable({ bookings, caption, columns, empty }: { bookings: Booking[]; caption: string; columns: Column<Booking>[]; empty: React.ReactNode }) {
  return <DataTable caption={caption} rows={bookings} columns={columns} rowKey={(b) => b.id} empty={empty} initialSort={{ key: "dates", dir: "desc" }} />;
}
