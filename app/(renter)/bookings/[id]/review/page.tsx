"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useOwnedBooking } from "@/components/bookings/useOwnedBooking";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import { EmptyState, Loading, Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { addReview } from "@/lib/domain";

export default function ReviewPage() {
  const { booking, car, user, status, id } = useOwnedBooking();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (status === "loading") return <div className="page"><Loading /></div>;
  if (status !== "ok" || !booking || !user || booking.renterId !== user.id)
    return <div className="page page--mid"><Notice tone="error" title="Not yours.">You can only review your own trips.</Notice></div>;

  const eligible = booking.status === "completed";
  if (!eligible && !done)
    return (
      <div className="page page--mid">
        <EmptyState title={booking.status === "reviewed" ? "You've already reviewed this trip" : "This trip can't be reviewed yet"} action={<Link href={`/bookings/${id}`} className="btn btn--primary">Back to booking</Link>}>
          {booking.status === "reviewed" ? "Thanks for your feedback! Each trip can be reviewed once." : "You can leave a review once the trip is completed."}
        </EmptyState>
      </div>
    );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const r = addReview(user!.id, booking!.id, rating, comment);
    if (!r.ok) return setError(r.error);
    setDone(true);
  }

  if (done)
    return (
      <div className="page page--mid stack">
        <PageHeader title="Thank you!" />
        <Notice tone="success" title="Review posted.">Your review for the {car?.make} {car?.model} is now visible on the listing.</Notice>
        <div className="row"><Button href={`/cars/${booking.carId}`} variant="primary">See the listing</Button><Button href="/bookings" variant="secondary">My bookings</Button></div>
      </div>
    );

  return (
    <div className="page page--mid stack">
      <PageHeader title="Write a review" sub={car ? `How was the ${car.year} ${car.make} ${car.model}?` : undefined} />
      <form className="panel stack" onSubmit={onSubmit} noValidate>
        <fieldset className="star-input" aria-label="Rating">
          <legend className="field__label" style={{ marginBottom: 4 }}>Your rating</legend>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} data-on={n <= rating} title={`${n} star${n > 1 ? "s" : ""}`}>
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} />
              <span aria-hidden="true">★</span>
              <span className="sr-only">{n} star{n > 1 ? "s" : ""}</span>
            </label>
          ))}
        </fieldset>
        <TextAreaField id="comment" label="Your review" value={comment} onChange={(e) => setComment(e.target.value)} hint="At least 10 characters. Be kind and specific." />
        {error && <p className="field__error" role="alert">{error}</p>}
        <Button type="submit" variant="amber">Post review</Button>
      </form>
    </div>
  );
}
