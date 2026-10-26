"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import { EmptyState, Loading, Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { resolveDispute } from "@/lib/domain";
import { formatDate, formatDateRange, formatETB } from "@/lib/format";
import { useBookings, useCars, useDisputes, useHydrated, useSession, useUsers } from "@/lib/hooks";

export default function AdminDisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const { user } = useSession();
  const disputes = useDisputes();
  const bookings = useBookings();
  const cars = useCars();
  const users = useUsers();
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const d = disputes.find((x) => x.id === id);
  if (!hydrated || (disputes.length === 0 && !d)) return <Loading />;
  if (!d) return <EmptyState title="Dispute not found" action={<Link href="/admin/disputes" className="btn btn--primary">All disputes</Link>} />;
  const b = bookings.find((x) => x.id === d.bookingId);
  const car = cars.find((c) => c.id === b?.carId);
  const name = (u?: string) => users.find((x) => x.id === u)?.name ?? "Unknown";

  function resolve() {
    const r = resolveDispute(user?.id ?? null, d!.id, notes);
    setMsg(r.ok ? { tone: "success", text: "Dispute resolved. The booking is now marked resolved." } : { tone: "error", text: r.error });
  }

  return (
    <div className="stack" style={{ maxWidth: 860 }}>
      <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/admin/disputes">Disputes</Link> / {d.reason}</nav>
      <PageHeader title={d.reason} sub={`Opened by ${name(d.openedBy)} on ${formatDate(d.createdAt)}`} actions={<Badge tone={d.status === "open" ? "warn" : "success"}>{d.status}</Badge>} />
      <section className="panel stack stack--sm" aria-labelledby="ctx"><h2 id="ctx" className="h2">The rental</h2>
        {b && car ? <dl className="receipt"><dt>Car</dt><dd>{car.year} {car.make} {car.model}</dd><dt>Renter</dt><dd>{name(b.renterId)}</dd><dt>Owner</dt><dd>{name(b.ownerId)}</dd><dt>Dates</dt><dd>{formatDateRange(b.startDate, b.endDate)}</dd><dt>Total</dt><dd>{formatETB(b.total)}</dd></dl> : <p className="muted">Booking details are no longer available.</p>}
      </section>
      <section className="panel stack stack--sm" aria-labelledby="desc"><h2 id="desc" className="h2">What happened</h2><p>{d.description}</p>
        {d.messages.length > 0 && <ul style={{ margin: 0, paddingLeft: 20 }}>{d.messages.map((m, i) => <li key={i}><strong>{name(m.by)}</strong> ({formatDate(m.at)}): {m.text}</li>)}</ul>}</section>
      {d.status === "resolved" ? (
        <Notice tone="success" title="Resolution.">{d.resolutionNotes} <span className="muted small">Resolved by {name(d.resolvedBy)}{d.resolvedAt ? ` on ${formatDate(d.resolvedAt)}` : ""}.</span></Notice>
      ) : (
        <section className="panel stack" aria-labelledby="res"><h2 id="res" className="h2">Record a resolution</h2>
          <TextAreaField id="notes" label="Resolution notes" value={notes} onChange={(e) => setNotes(e.target.value)} hint="At least 5 characters. Both parties see these notes." />
          {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
          <div><Button variant="primary" onClick={resolve}>Resolve dispute</Button></div></section>
      )}
    </div>
  );
}
