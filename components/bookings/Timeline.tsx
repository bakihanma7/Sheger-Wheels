import type { Booking, BookingStatus } from "@/lib/types";
import { formatDate } from "@/lib/format";

const FLOW: { status: BookingStatus; label: string }[] = [
  { status: "requested", label: "Request sent" },
  { status: "confirmed", label: "Owner approved" },
  { status: "in_progress", label: "Rental under way" },
  { status: "completed", label: "Returned" },
  { status: "reviewed", label: "Review left" },
];
const ORDER: BookingStatus[] = ["requested", "confirmed", "in_progress", "completed", "reviewed"];

export function Timeline({ booking }: { booking: Booking }) {
  const terminal: Partial<Record<BookingStatus, string>> = { declined: "Owner declined the request", cancelled: "Booking cancelled", disputed: "Issue raised: awaiting admin", resolved: "Issue resolved by admin" };
  const idx = ORDER.indexOf(booking.status);
  return (
    <ol className="timeline" aria-label="Trip timeline">
      {FLOW.map((s, i) => (
        <li key={s.status} data-done={idx >= i || (idx === -1 && i === 0)} data-current={idx === i}>
          <span className="dot" aria-hidden="true" />
          <span>
            {s.label}
            {i === 0 && <span className="muted small"> · {formatDate(booking.createdAt)}</span>}
            {idx === i && <span className="sr-only"> (current step)</span>}
          </span>
        </li>
      ))}
      {terminal[booking.status] && (
        <li data-done="true" data-current="true">
          <span className="dot" aria-hidden="true" />
          <strong>{terminal[booking.status]}</strong>
        </li>
      )}
    </ol>
  );
}
