import type { BookingStatus, CarStatus } from "@/lib/types";

const BOOKING: Record<BookingStatus, [string, string]> = {
  requested: ["Requested", "warn"],
  confirmed: ["Confirmed", "info"],
  in_progress: ["In progress", "info"],
  completed: ["Completed", "success"],
  reviewed: ["Reviewed", "success"],
  declined: ["Declined", "danger"],
  cancelled: ["Cancelled", "danger"],
  disputed: ["Disputed", "danger"],
  resolved: ["Resolved", ""],
};
const CAR: Record<CarStatus, [string, string]> = {
  draft: ["Draft", ""],
  pending: ["Pending review", "warn"],
  approved: ["Approved", "success"],
  rejected: ["Rejected", "danger"],
  inactive: ["Inactive", ""],
};

export function Badge({ children, tone = "" }: { children: React.ReactNode; tone?: "" | "success" | "info" | "warn" | "danger" }) {
  return <span className={`badge${tone ? ` badge--${tone}` : ""}`}>{children}</span>;
}
export function BookingBadge({ status }: { status: BookingStatus }) {
  const [label, tone] = BOOKING[status] ?? [status, ""];
  return <Badge tone={tone as "success"}>{label}</Badge>;
}
export function CarBadge({ status }: { status: CarStatus }) {
  const [label, tone] = CAR[status] ?? [status, ""];
  return <Badge tone={tone as "success"}>{label}</Badge>;
}
