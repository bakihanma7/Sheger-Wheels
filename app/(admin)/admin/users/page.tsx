"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { Notice, EmptyState } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { setUserStatus } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { useSession, useUsers } from "@/lib/hooks";

export default function AdminUsersPage() {
  const { user: me } = useSession();
  const users = useUsers();
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const shown = users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q.trim().toLowerCase()));

  function toggle(id: string, to: "active" | "suspended") {
    const r = setUserStatus(me?.id ?? null, id, to);
    setMsg(r.ok ? { tone: "success", text: to === "suspended" ? `${r.data.name} is suspended and can't take demo actions.` : `${r.data.name} was reinstated.` } : { tone: "error", text: r.error });
  }

  return (
    <div className="stack">
      <PageHeader title="Users" sub="Demo accounts. Suspending blocks their actions immediately." />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <div style={{ maxWidth: 360 }}><Field id="q" label="Search name or email" type="search" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <DataTable caption={`Users (${shown.length})`} rows={shown} rowKey={(u) => u.id} empty={<EmptyState title="No users match your search" />}
        columns={[
          { key: "name", header: "Name", sortValue: (u) => u.name, render: (u) => <Link href={`/admin/users/${u.id}`}><u>{u.name}</u></Link> },
          { key: "email", header: "Email", sortValue: (u) => u.email, render: (u) => u.email },
          { key: "roles", header: "Roles", render: (u) => u.roles.join(", ") },
          { key: "status", header: "Status", sortValue: (u) => u.status, render: (u) => <Badge tone={u.status === "active" ? "success" : "danger"}>{u.status}</Badge> },
          { key: "joined", header: "Joined", sortValue: (u) => u.createdAt, render: (u) => formatDate(u.createdAt) },
          { key: "act", header: "Action", render: (u) => u.roles.includes("admin") || u.id === me?.id ? <span className="muted small">—</span> : u.status === "active" ? <Button variant="secondary" onClick={() => toggle(u.id, "suspended")}>Suspend</Button> : <Button variant="primary" onClick={() => toggle(u.id, "active")}>Reinstate</Button> },
        ]} />
    </div>
  );
}
