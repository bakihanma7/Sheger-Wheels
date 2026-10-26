import type { Booking } from "@/lib/types";
import { formatETB } from "@/lib/format";

export function Receipt({ totals, days, pricePerDay, paymentRef }: { totals: { subtotal: number; fee: number; total: number }; days: number; pricePerDay: number; paymentRef?: string }) {
  return (
    <dl className="receipt" aria-label="Price breakdown">
      <dt>
        {formatETB(pricePerDay)} × {days} day{days === 1 ? "" : "s"}
      </dt>
      <dd>{formatETB(totals.subtotal)}</dd>
      <dt>Service fee (8%)</dt>
      <dd>{formatETB(totals.fee)}</dd>
      <dt className="total">Total</dt>
      <dd className="total">{formatETB(totals.total)}</dd>
      {paymentRef && (
        <>
          <dt>Demo transaction ref</dt>
          <dd>{paymentRef}</dd>
        </>
      )}
    </dl>
  );
}

export const receiptFromBooking = (b: Booking) => ({ totals: { subtotal: b.subtotal, fee: b.fee, total: b.total }, days: b.days, pricePerDay: b.pricePerDay, paymentRef: b.paymentRef });
