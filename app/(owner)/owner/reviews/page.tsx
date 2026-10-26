"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import { EmptyState, Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Stars } from "@/components/ui/Stars";
import { replyToReview } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { useCars, useReviews, useSession, useUsers } from "@/lib/hooks";

export default function OwnerReviewsPage() {
  const { user } = useSession();
  const reviews = useReviews();
  const cars = useCars();
  const users = useUsers();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<Record<string, { tone: "success" | "error"; text: string }>>({});
  const mine = reviews.filter((r) => r.ownerId === user?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function reply(id: string) {
    const r = replyToReview(user?.id ?? null, id, drafts[id] ?? "");
    setMsg((m) => ({ ...m, [id]: r.ok ? { tone: "success", text: "Reply posted." } : { tone: "error", text: r.error } }));
    if (r.ok) setDrafts((d) => ({ ...d, [id]: "" }));
  }

  return (
    <div className="stack">
      <PageHeader title="Reviews" sub="What renters said about your cars." />
      {mine.length === 0 ? <EmptyState title="No reviews yet">Reviews appear after renters complete a trip.</EmptyState> : mine.map((r) => {
        const car = cars.find((c) => c.id === r.carId);
        return (
          <article key={r.id} className="panel stack stack--sm">
            <p><strong>{users.find((u) => u.id === r.renterId)?.name ?? "Renter"}</strong> <Stars value={r.rating} /> <span className="muted small">{car ? `${car.make} ${car.model}` : ""} · {formatDate(r.createdAt)}</span></p>
            <p>{r.comment}</p>
            {r.ownerReply ? <p className="notice notice--info"><strong>Your reply:</strong> {r.ownerReply}</p> : (
              <div className="stack stack--sm">
                <TextAreaField id={`reply-${r.id}`} label="Reply publicly" value={drafts[r.id] ?? ""} onChange={(e) => setDrafts({ ...drafts, [r.id]: e.target.value })} />
                {msg[r.id] && <Notice tone={msg[r.id].tone}>{msg[r.id].text}</Notice>}
                <div><Button variant="primary" onClick={() => reply(r.id)}>Post reply</Button></div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
