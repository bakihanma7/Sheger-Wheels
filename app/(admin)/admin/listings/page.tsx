"use client";

import { useState } from "react";
import { CarBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { reviewListing } from "@/lib/domain";
import { formatETB } from "@/lib/format";
import { useCars, useSession, useUsers } from "@/lib/hooks";

export default function AdminListingsPage() {
  const { user } = useSession();
  const cars = useCars();
  const users = useUsers();
  const [tab, setTab] = useState("pending");
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const shown = tab === "all" ? cars : cars.filter((c) => c.status === tab);

  function decide(id: string, d: "approve" | "reject") {
    const r = reviewListing(user?.id ?? null, id, d);
    setMsg(r.ok ? { tone: "success", text: d === "approve" ? "Listing approved. It's now public." : "Listing rejected. The owner can edit and resubmit." } : { tone: "error", text: r.error });
  }

  return (
    <div className="stack">
      <PageHeader title="Listings" sub="Approve or reject cars before they appear publicly." />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <div className="tabs" role="tablist" aria-label="Filter listings">
        {["pending", "approved", "rejected", "inactive", "draft", "all"].map((t) => <button key={t} type="button" role="tab" className="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)} ({t === "all" ? cars.length : cars.filter((c) => c.status === t).length})</button>)}
      </div>
      <DataTable caption={`Listings (${shown.length})`} rows={shown} rowKey={(c) => c.id}
        empty={<EmptyState title="Nothing here">{tab === "pending" ? "No listings are waiting for review." : "No listings with that status."}</EmptyState>}
        columns={[
          { key: "car", header: "Car", sortValue: (c) => `${c.make} ${c.model}`, render: (c) => <span>{c.year} {c.make} {c.model}<br /><span className="muted small">⌖ {c.neighbourhood}</span></span> },
          { key: "owner", header: "Owner", sortValue: (c) => users.find((u) => u.id === c.ownerId)?.name ?? "", render: (c) => users.find((u) => u.id === c.ownerId)?.name ?? "Unknown" },
          { key: "price", header: "Price / day", numeric: true, sortValue: (c) => c.pricePerDay, render: (c) => formatETB(c.pricePerDay) },
          { key: "status", header: "Status", sortValue: (c) => c.status, render: (c) => <CarBadge status={c.status} /> },
          { key: "act", header: "Review", render: (c) => c.status === "pending" ? (
            <span className="row"><Button variant="primary" onClick={() => decide(c.id, "approve")}>Approve</Button><Button variant="secondary" onClick={() => decide(c.id, "reject")}>Reject</Button></span>
          ) : <span className="muted small">—</span> },
        ]} />
    </div>
  );
}
