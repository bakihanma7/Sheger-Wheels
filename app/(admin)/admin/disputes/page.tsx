"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate } from "@/lib/format";
import { useBookings, useCars, useDisputes, useUsers } from "@/lib/hooks";

export default function AdminDisputesPage() {
  const disputes = useDisputes();
  const bookings = useBookings();
  const cars = useCars();
  const users = useUsers();
  const [tab, setTab] = useState("open");
  const shown = tab === "all" ? disputes : disputes.filter((d) => d.status === tab);
  return (
    <div className="stack">
      <PageHeader title="Disputes" sub="Review issues raised during rentals and record a resolution." />
      <div className="tabs" role="tablist" aria-label="Filter disputes">
        {["open", "resolved", "all"].map((t) => <button key={t} type="button" role="tab" className="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}
      </div>
      <DataTable caption={`Disputes (${shown.length})`} rows={shown} rowKey={(d) => d.id} empty={<EmptyState title="No disputes to review">{tab === "open" ? "Nothing is waiting for you." : "Nothing here."}</EmptyState>}
        columns={[
          { key: "reason", header: "Reason", sortValue: (d) => d.reason, render: (d) => <Link href={`/admin/disputes/${d.id}`}><u>{d.reason}</u></Link> },
          { key: "car", header: "Car", render: (d) => { const b = bookings.find((x) => x.id === d.bookingId); const c = cars.find((x) => x.id === b?.carId); return c ? `${c.make} ${c.model}` : "—"; } },
          { key: "by", header: "Opened by", render: (d) => users.find((u) => u.id === d.openedBy)?.name ?? "Unknown" },
          { key: "on", header: "Opened", sortValue: (d) => d.createdAt, render: (d) => formatDate(d.createdAt) },
          { key: "st", header: "Status", sortValue: (d) => d.status, render: (d) => <Badge tone={d.status === "open" ? "warn" : "success"}>{d.status}</Badge> },
        ]} />
    </div>
  );
}
