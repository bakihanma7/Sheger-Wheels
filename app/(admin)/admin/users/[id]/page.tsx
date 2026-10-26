"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, Loading, Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { setUserStatus } from "@/lib/domain";
import { formatDate, formatETB } from "@/lib/format";
import { useBookings, useCars, useHydrated, useSession, useUsers } from "@/lib/hooks";

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const { user: me } = useSession();
  const users = useUsers();
  const cars = useCars();
  const bookings = useBookings();
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const u = users.find((x) => x.id === id);
  if (!hydrated || (users.length === 0 && !u)) return <Loading />;
  if (!u) return <EmptyState title="User not found" action={<Link href="/admin/users" className="btn btn--primary">All users</Link>} />;
  const theirCars = cars.filter((c) => c.ownerId === u.id);
  const asRenter = bookings.filter((b) => b.renterId === u.id);
  const asOwner = bookings.filter((b) => b.ownerId === u.id);
  const locked = u.roles.includes("admin") || u.id === me?.id;

  function toggle() {
    const r = setUserStatus(me?.id ?? null, u!.id, u!.status === "active" ? "suspended" : "active");
    setMsg(r.ok ? { tone: "success", text: `Account is now ${r.data.status}.` } : { tone: "error", text: r.error });
  }

  return (
    <div className="stack" style={{ maxWidth: 820 }}>
      <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/admin/users">Users</Link> / {u.name}</nav>
      <PageHeader title={u.name} sub={u.email} actions={<Badge tone={u.status === "active" ? "success" : "danger"}>{u.status}</Badge>} />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <section className="panel stack stack--sm" aria-labelledby="det">
        <h2 id="det" className="h2">Account</h2>
        <dl className="receipt">
          <dt>Phone</dt><dd>{u.phone}</dd>
          <dt>Roles</dt><dd>{u.roles.join(", ")}</dd>
          <dt>Joined</dt><dd>{formatDate(u.createdAt)}</dd>
          <dt>Cars listed</dt><dd>{theirCars.length}</dd>
          <dt>Trips as renter</dt><dd>{asRenter.length} ({formatETB(asRenter.filter((b) => b.paymentStatus === "paid").reduce((n, b) => n + b.total, 0))} paid)</dd>
          <dt>Rentals as owner</dt><dd>{asOwner.length}</dd>
        </dl>
        {!locked && <div><Button variant={u.status === "active" ? "secondary" : "primary"} onClick={toggle}>{u.status === "active" ? "Suspend account" : "Reinstate account"}</Button></div>}
        {locked && <p className="muted small">{u.roles.includes("admin") ? "Admin accounts can't be suspended in this demo." : "You can't change your own status."}</p>}
      </section>
    </div>
  );
}
