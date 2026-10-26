"use client";

import Link from "next/link";
import { useState } from "react";
import type { Dispute, User } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import { EmptyState, Notice } from "@/components/ui/Notice";
import { replyToDispute } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { useBookings, useCars, useDisputes, useSession, useUsers } from "@/lib/hooks";

/** Disputes the signed-in user is a party to (renter or owner of the booking). Replies re-check party membership. */
export function DisputeList({ role }: { role: "owner" }) {
  const { user } = useSession();
  const disputes = useDisputes();
  const bookings = useBookings();
  const cars = useCars();
  const users = useUsers();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<Record<string, { tone: "success" | "error"; text: string }>>({});
  const mine = disputes.filter((d) => { const b = bookings.find((x) => x.id === d.bookingId); return b && user && (role === "owner" ? b.ownerId === user.id : b.renterId === user.id); });
  const who = (u: string) => users.find((x: User) => x.id === u)?.name ?? "Someone";

  function send(d: Dispute) {
    const r = replyToDispute(user?.id ?? null, d.id, drafts[d.id] ?? "");
    setMsg((m) => ({ ...m, [d.id]: r.ok ? { tone: "success", text: "Message sent." } : { tone: "error", text: r.error } }));
    if (r.ok) setDrafts((x) => ({ ...x, [d.id]: "" }));
  }

  if (mine.length === 0) return <EmptyState title="No disputes to review">Issues raised on your rentals will appear here.</EmptyState>;
  return (
    <>
      {mine.map((d) => {
        const b = bookings.find((x) => x.id === d.bookingId)!;
        const car = cars.find((c) => c.id === b.carId);
        return (
          <article key={d.id} className="panel stack stack--sm">
            <div className="row row--between"><p className="h3">{d.reason} · {car ? `${car.make} ${car.model}` : ""}</p><Badge tone={d.status === "open" ? "warn" : "success"}>{d.status === "open" ? "Open" : "Resolved"}</Badge></div>
            <p className="muted small">Opened by {who(d.openedBy)} on {formatDate(d.createdAt)}</p>
            <p>{d.description}</p>
            {d.messages.length > 0 && <ul style={{ margin: 0, paddingLeft: 20 }}>{d.messages.map((m, i) => <li key={i}><strong>{who(m.by)}:</strong> {m.text}</li>)}</ul>}
            {d.status === "resolved" && <Notice tone="success" title="Admin resolution.">{d.resolutionNotes}</Notice>}
            {d.status === "open" && (
              <>
                <TextAreaField id={`d-${d.id}`} label="Reply" value={drafts[d.id] ?? ""} onChange={(e) => setDrafts({ ...drafts, [d.id]: e.target.value })} />
                {msg[d.id] && <Notice tone={msg[d.id].tone}>{msg[d.id].text}</Notice>}
                <div className="row"><Button variant="primary" onClick={() => send(d)}>Send reply</Button><Link href={`/owner/cars/${b.carId}/bookings`} className="btn btn--secondary">View booking</Link></div>
              </>
            )}
          </article>
        );
      })}
    </>
  );
}
