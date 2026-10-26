"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, TextAreaField } from "@/components/ui/Field";
import { EmptyState, Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { createAnnouncement, setAnnouncementActive } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { useAnnouncements, useSession } from "@/lib/hooks";

export default function AdminAnnouncementsPage() {
  const { user } = useSession();
  const list = useAnnouncements();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const sorted = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const r = createAnnouncement(user?.id ?? null, title, message);
    if (r.ok) { setTitle(""); setMessage(""); setMsg({ tone: "success", text: "Announcement published. Renters see it on their dashboard." }); }
    else setMsg({ tone: "error", text: r.error });
  }
  function toggle(id: string, active: boolean) {
    const r = setAnnouncementActive(user?.id ?? null, id, active);
    setMsg(r.ok ? { tone: "success", text: active ? "Announcement is live again." : "Announcement deactivated." } : { tone: "error", text: r.error });
  }

  return (
    <div className="stack" style={{ maxWidth: 820 }}>
      <PageHeader title="Announcements" sub="Short notices shown on every renter dashboard while active." />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <form className="panel stack" onSubmit={onSubmit} noValidate aria-label="New announcement">
        <h2 className="h2">New announcement</h2>
        <Field id="title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextAreaField id="message" label="Message" value={message} onChange={(e) => setMessage(e.target.value)} hint="Up to 500 characters." />
        <div><Button type="submit" variant="amber">Publish</Button></div>
      </form>
      <section className="stack" aria-labelledby="all"><h2 id="all" className="h2">All announcements</h2>
        {sorted.length === 0 ? <EmptyState title="No announcements yet" /> : sorted.map((a) => (
          <article key={a.id} className="panel stack stack--sm">
            <div className="row row--between"><p className="h3">{a.title}</p><Badge tone={a.active ? "success" : ""}>{a.active ? "Active" : "Inactive"}</Badge></div>
            <p>{a.message}</p>
            <p className="muted small">Published {formatDate(a.createdAt)}</p>
            <div><Button variant="secondary" onClick={() => toggle(a.id, !a.active)}>{a.active ? "Deactivate" : "Reactivate"}</Button></div>
          </article>
        ))}
      </section>
    </div>
  );
}
