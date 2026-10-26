"use client";

import Link from "next/link";
import { useState } from "react";
import { CarBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { setCarActive } from "@/lib/domain";
import { formatETB } from "@/lib/format";
import { useBookings, useCars, useSession } from "@/lib/hooks";

export default function OwnerCarsPage() {
  const { user } = useSession();
  const cars = useCars();
  const bookings = useBookings();
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [tab, setTab] = useState("all");
  const mine = cars.filter((c) => c.ownerId === user?.id);
  const shown = tab === "all" ? mine : mine.filter((c) => c.status === tab);
  const saved = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("saved") : null;

  function toggle(id: string, active: boolean) {
    const r = setCarActive(user?.id ?? null, id, active);
    setMsg(r.ok ? { tone: "success", text: active ? "Listing reactivated." : "Listing deactivated. It's hidden from the catalogue." } : { tone: "error", text: r.error });
  }

  return (
    <div className="stack">
      <PageHeader title="My cars" sub="Everything you've listed and where it stands." actions={<Button href="/owner/cars/new" variant="amber">Add a car</Button>} />
      {saved && <Notice tone="success" title="Saved.">{saved === "submitted" ? "Your listing was submitted for admin review." : "Your listing was saved as a draft."}</Notice>}
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <div className="tabs" role="tablist" aria-label="Filter by status">
        {["all", "approved", "pending", "draft", "rejected", "inactive"].map((t) => <button key={t} type="button" role="tab" className="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}
      </div>
      <DataTable
        caption={`Your cars (${shown.length})`}
        rows={shown}
        rowKey={(c) => c.id}
        empty={<EmptyState title={mine.length ? "No cars with that status" : "You haven't listed a car yet"} action={<Button href="/owner/cars/new" variant="primary">Add your first car</Button>}>New listings are reviewed by an admin before going live.</EmptyState>}
        columns={[
          { key: "car", header: "Car", sortValue: (c) => `${c.make} ${c.model}`, render: (c) => <span>{c.year} {c.make} {c.model}<br /><span className="muted small">⌖ {c.neighbourhood}</span></span> },
          { key: "price", header: "Price / day", numeric: true, sortValue: (c) => c.pricePerDay, render: (c) => formatETB(c.pricePerDay) },
          { key: "status", header: "Status", sortValue: (c) => c.status, render: (c) => <CarBadge status={c.status} /> },
          { key: "req", header: "Requests", numeric: true, sortValue: (c) => bookings.filter((b) => b.carId === c.id && b.status === "requested").length, render: (c) => bookings.filter((b) => b.carId === c.id && b.status === "requested").length },
          { key: "actions", header: "Manage", render: (c) => (
            <span className="row" style={{ gap: 12 }}>
              <Link href={`/owner/cars/${c.id}/edit`}><u>Edit</u></Link>
              <Link href={`/owner/cars/${c.id}/availability`}><u>Availability</u></Link>
              <Link href={`/owner/cars/${c.id}/bookings`}><u>Bookings</u></Link>
              {c.status === "approved" && <button type="button" className="btn btn--secondary" style={{ minHeight: 44 }} onClick={() => toggle(c.id, false)}>Deactivate</button>}
              {c.status === "inactive" && <button type="button" className="btn btn--secondary" style={{ minHeight: 44 }} onClick={() => toggle(c.id, true)}>Reactivate</button>}
            </span>
          ) },
        ]}
      />
    </div>
  );
}
