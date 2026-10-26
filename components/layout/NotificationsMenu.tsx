"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { User } from "@/lib/types";
import { useBookings, useCars, useDisputes } from "@/lib/hooks";
import { deriveNotifications } from "@/lib/selectors";
import { relativeTime } from "@/lib/format";

/** Simulated alerts derived from stored records. No server-sent events involved. */
export function NotificationsMenu({ user }: { user: User }) {
  const cars = useCars();
  const bookings = useBookings();
  const disputes = useDisputes();
  const items = useMemo(() => deriveNotifications(user, cars, bookings, disputes), [user, cars, bookings, disputes]);
  return (
    <details style={{ position: "relative" }}>
      <summary className="chip" style={{ listStyle: "none", cursor: "pointer" }} aria-label={`Alerts (${items.length}), simulated`}>
        🔔 <span style={{ marginLeft: 6 }}>{items.length}</span>
      </summary>
      <div className="panel" style={{ position: "absolute", right: 0, top: 52, width: 340, maxWidth: "90vw", zIndex: 20 }}>
        <p className="h3">Alerts <span className="sim-label">Simulation</span></p>
        {items.length === 0 ? (
          <p className="muted small" style={{ marginTop: 8 }}>You're all caught up.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map((n) => (
              <li key={n.id}>
                <Link href={n.href} style={{ fontSize: 14 }}>
                  {n.text}
                </Link>
                <div className="muted small">{relativeTime(n.at)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
