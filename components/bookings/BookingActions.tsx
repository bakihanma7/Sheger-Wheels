"use client";

import { useState } from "react";
import Link from "next/link";
import type { Booking } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, TextAreaField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { TRANSITIONS, allowedActions, transitionBooking, type BookingAction } from "@/lib/domain";
import { useSession } from "@/lib/hooks";

const SUCCESS: Record<BookingAction, string> = {
  approve: "Request approved. The renter's demo payment is now marked paid.",
  decline: "Request declined. The demo payment was refunded.",
  cancel: "Booking cancelled. The demo payment was refunded.",
  start: "Rental started.",
  complete: "Marked as returned. The renter can now leave a review.",
  dispute: "Issue raised. An admin will review it.",
};

/** Buttons come from allowedActions(), which runs the same checks as transitionBooking(). Hiding is cosmetic; the function re-checks. */
export function BookingActions({ booking, only, showReview }: { booking: Booking; only?: BookingAction[]; showReview?: boolean }) {
  const { user } = useSession();
  const [dialog, setDialog] = useState<null | "cancel" | "dispute">(null);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const actions = allowedActions(user, booking).filter((a) => !only || only.includes(a));

  function run(a: BookingAction) {
    const r = transitionBooking(user?.id ?? null, booking.id, a, a === "dispute" ? { reason, description } : undefined);
    if (r.ok) {
      setMsg({ tone: "success", text: SUCCESS[a] });
      setDialog(null);
      setReason("");
      setDescription("");
    } else {
      setMsg({ tone: "error", text: r.error });
    }
  }

  const onClick = (a: BookingAction) => (a === "cancel" || a === "dispute" ? setDialog(a) : run(a));

  return (
    <div className="stack stack--sm">
      <div className="row">
        {actions.map((a) => (
          <Button key={a} variant={a === "approve" || a === "start" || a === "complete" ? "primary" : "secondary"} onClick={() => onClick(a)}>
            {TRANSITIONS[a].label}
          </Button>
        ))}
        {showReview && booking.status === "completed" && user?.id === booking.renterId && (
          <Link href={`/bookings/${booking.id}/review`} className="btn btn--amber">Leave a review</Link>
        )}
        {actions.length === 0 && !(showReview && booking.status === "completed") && <p className="muted small">No actions available for a {booking.status.replace("_", " ")} booking.</p>}
      </div>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {dialog === "cancel" && (
        <Dialog title="Cancel this booking?" onClose={() => setDialog(null)}>
          <p>Your demo payment will be refunded. This can't be undone.</p>
          <div className="row">
            <Button variant="primary" onClick={() => run("cancel")}>Yes, cancel booking</Button>
            <Button variant="secondary" onClick={() => setDialog(null)}>Keep booking</Button>
          </div>
        </Dialog>
      )}
      {dialog === "dispute" && (
        <Dialog title="Raise an issue" onClose={() => setDialog(null)}>
          <Field id="reason" label="What went wrong?" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Vehicle condition" />
          <TextAreaField id="description" label="Describe the issue" value={description} onChange={(e) => setDescription(e.target.value)} />
          {msg?.tone === "error" && <p className="field__error" role="alert">{msg.text}</p>}
          <div className="row">
            <Button variant="primary" onClick={() => run("dispute")}>Submit issue</Button>
            <Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
