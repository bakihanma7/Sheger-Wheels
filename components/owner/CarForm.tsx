"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Car, Fuel, Transmission } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, SelectField, TextAreaField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { NEIGHBOURHOODS, PHOTO_CHOICES, createCar, updateCar, validateCarInput, type CarInput } from "@/lib/domain";
import { useSession } from "@/lib/hooks";

const empty: CarInput = { make: "", model: "", year: new Date().getFullYear() - 3, transmission: "Automatic", fuel: "Petrol", seats: 5, neighbourhood: "Bole", pricePerDay: 3000, description: "", photos: [PHOTO_CHOICES[0]] };

export function CarForm({ car }: { car?: Car }) {
  const router = useRouter();
  const { user } = useSession();
  const [f, setF] = useState<CarInput>(car ? { make: car.make, model: car.model, year: car.year, transmission: car.transmission, fuel: car.fuel, seats: car.seats, neighbourhood: car.neighbourhood, pricePerDay: car.pricePerDay, description: car.description, photos: car.photos.filter((p) => PHOTO_CHOICES.includes(p)) } : empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState("");
  const set = <K extends keyof CarInput>(k: K, v: CarInput[K]) => setF((p) => ({ ...p, [k]: v }));

  function save(submit: boolean) {
    setFormError("");
    setSaved("");
    const errs = validateCarInput(f);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const r = car ? updateCar(user?.id ?? null, car.id, f, submit) : createCar(user?.id ?? null, f, submit);
    if (!r.ok) return setFormError(r.error);
    if (!car) return router.push(`/owner/cars?saved=${encodeURIComponent(submit ? "submitted" : "draft")}`);
    setSaved(submit && (car.status === "draft" || car.status === "rejected") ? "Saved and submitted for admin review." : "Changes saved.");
  }

  const onSubmit = (e: FormEvent) => { e.preventDefault(); save(false); };
  const canSubmit = !car || car.status === "draft" || car.status === "rejected";

  return (
    <form className="stack" onSubmit={onSubmit} noValidate aria-label={car ? "Edit car listing" : "New car listing"}>
      <Notice tone="info">New and resubmitted listings are reviewed by an admin before they appear publicly. Photos are demo images.</Notice>
      <section className="panel stack" aria-labelledby="basics">
        <h2 id="basics" className="h2">01 · The basics</h2>
        <div className="field-row">
          <Field id="make" label="Make" value={f.make} onChange={(e) => set("make", e.target.value)} error={errors.make} />
          <Field id="model" label="Model" value={f.model} onChange={(e) => set("model", e.target.value)} error={errors.model} />
        </div>
        <Field id="year" label="Year" type="number" value={f.year} onChange={(e) => set("year", Number(e.target.value))} error={errors.year} />
      </section>
      <section className="panel stack" aria-labelledby="specs">
        <h2 id="specs" className="h2">02 · Specifications</h2>
        <div className="field-row">
          <SelectField id="transmission" label="Transmission" value={f.transmission} onChange={(e) => set("transmission", e.target.value as Transmission)}><option>Automatic</option><option>Manual</option></SelectField>
          <SelectField id="fuel" label="Fuel" value={f.fuel} onChange={(e) => set("fuel", e.target.value as Fuel)}>{["Petrol", "Diesel", "Hybrid", "Electric"].map((x) => <option key={x}>{x}</option>)}</SelectField>
        </div>
        <Field id="seats" label="Seats" type="number" min={1} max={20} value={f.seats} onChange={(e) => set("seats", Number(e.target.value))} error={errors.seats} />
      </section>
      <section className="panel stack" aria-labelledby="pricing">
        <h2 id="pricing" className="h2">03 · Price</h2>
        <Field id="pricePerDay" label="Daily price (ETB)" type="number" min={500} step={50} value={f.pricePerDay} onChange={(e) => set("pricePerDay", Number(e.target.value))} error={errors.pricePerDay} hint="Between ETB 500 and ETB 50,000. Prices are locked into each booking when it's requested." />
      </section>
      <section className="panel stack" aria-labelledby="loc">
        <h2 id="loc" className="h2">04 · Pickup location</h2>
        <SelectField id="neighbourhood" label="Neighbourhood" value={f.neighbourhood} onChange={(e) => set("neighbourhood", e.target.value)} error={errors.neighbourhood} hint="Map pins use approximate sample coordinates for the neighbourhood.">
          {Object.keys(NEIGHBOURHOODS).map((n) => <option key={n}>{n}</option>)}
        </SelectField>
      </section>
      <section className="panel stack" aria-labelledby="photos">
        <h2 id="photos" className="h2">05 · Photos</h2>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="small muted">Choose one or more demo photos (the first is the cover).</legend>
          <div className="row" style={{ marginTop: 8 }}>
            {PHOTO_CHOICES.map((p, i) => {
              const on = f.photos.includes(p);
              return (
                <label key={p} className="check" style={{ flexDirection: "column", gap: 4, minHeight: 0 }}>
                  <span style={{ position: "relative", width: 120, height: 72, borderRadius: 8, overflow: "hidden", outline: on ? "3px solid var(--c-brand)" : "1px solid var(--c-border)" }}>
                    <Image src={p} alt={`Demo photo ${i + 1}`} fill sizes="120px" unoptimized style={{ objectFit: "cover" }} />
                  </span>
                  <input type="checkbox" checked={on} onChange={() => set("photos", on ? f.photos.filter((x) => x !== p) : [...f.photos, p])} aria-label={`Use demo photo ${i + 1}`} />
                </label>
              );
            })}
          </div>
        </fieldset>
        {errors.photos && <p className="field__error" role="alert">{errors.photos}</p>}
      </section>
      <section className="panel stack" aria-labelledby="desc">
        <h2 id="desc" className="h2">06 · Description</h2>
        <TextAreaField id="description" label="Tell renters about the car" value={f.description} onChange={(e) => set("description", e.target.value)} error={errors.description} />
      </section>
      {formError && <Notice tone="error">{formError}</Notice>}
      {saved && <Notice tone="success">{saved}</Notice>}
      <div className="row">
        <Link href="/owner/cars" className="btn btn--secondary">Cancel</Link>
        <Button type="submit" variant="secondary">{car ? "Save changes" : "Save as draft"}</Button>
        {canSubmit && <Button variant="amber" onClick={() => save(true)}>{car ? "Save & submit for review" : "Submit for review"}</Button>}
      </div>
    </form>
  );
}
