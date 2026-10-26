"use client";

import { useMemo, useState } from "react";
import { BookingsTable, bookingColumns } from "@/components/bookings/BookingsTable";
import { SelectField } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { useBookings, useCars, useUsers } from "@/lib/hooks";
import { paginate } from "@/lib/selectors";

export default function AdminBookingsPage() {
  const bookings = useBookings();
  const cars = useCars();
  const users = useUsers();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => bookings.filter((b) => !status || b.status === status), [bookings, status]);
  const view = paginate(filtered, page, 10);
  const cols = bookingColumns({ cars, users, showRenter: true, showOwner: true});
  return (
    <div className="stack">
      <PageHeader title="All bookings" sub="Read-only view across the whole platform." />
      <div style={{ maxWidth: 260 }}>
        <SelectField id="status" label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All</option>
          {["requested", "confirmed", "in_progress", "completed", "reviewed", "declined", "cancelled", "disputed", "resolved"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </SelectField>
      </div>
      <BookingsTable bookings={view.items} caption={`Bookings (${filtered.length})`} columns={cols} empty={<EmptyState title="No bookings match" />} />
      {filtered.length > 0 && <Pagination page={view.page} pages={view.pages} total={view.total} label="Booking pages" onPage={setPage} />}
    </div>
  );
}
