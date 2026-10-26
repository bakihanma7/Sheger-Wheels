"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, SelectField } from "@/components/ui/Field";
import { SearchIcon } from "@/components/ui/Icons";
import { NEIGHBOURHOODS, validateDates } from "@/lib/domain";
import { addDays, todayISO } from "@/lib/format";
import { catalogueQueryToParams } from "@/lib/selectors";
import { BRAND } from "@/lib/brand";
import styles from "./landing.module.css";

export function Hero() {
  const router = useRouter();
  const [where, setWhere] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState("");
  const today = todayISO();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (start || end) {
      const err = validateDates(start, end);
      if (err) return setError(err);
    }
    setError("");
    router.push(`/cars?${catalogueQueryToParams({ neighbourhood: where, start, end }).toString()}`);
  }

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.heroComposition}>
        <div className={styles.heroCopy}>
          <p className="eyebrow">Local keys. Limitless possibilities.</p>
          <h1 id="hero-title" className={styles.heroTitle}>
            Your next chapter.
            <br />
            Your kind of car.
          </h1>
          <p className={styles.heroBody}>
            Rent a car from someone nearby in {BRAND.city}. Make room for spontaneous weekends, everyday adventures, and everything in between.
          </p>
        </div>
        <div className={styles.journey}>
          {/* The Figma travel photo isn't exportable here, so this is a themed placeholder. */}
          <div className={`${styles.journeyPhoto} photo-placeholder`} role="img" aria-label="Illustrative road scene" />
          <p className={styles.destinationLabel}>⌖ Somewhere along the Bole road (illustration)</p>
        </div>
      </div>

      <form className={styles.search} onSubmit={onSubmit} role="search" aria-label="Search cars" noValidate>
        <SelectField id="where" label="Where to?" value={where} onChange={(e) => setWhere(e.target.value)}>
          <option value="">Anywhere in {BRAND.city}</option>
          {Object.keys(NEIGHBOURHOODS).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </SelectField>
        <Field id="start" label="Pickup" type="date" min={today} value={start} onChange={(e) => { setStart(e.target.value); if (end && end <= e.target.value) setEnd(addDays(e.target.value, 1)); }} />
        <Field id="end" label="Return" type="date" min={start ? addDays(start, 1) : today} value={end} onChange={(e) => setEnd(e.target.value)} />
        <Button variant="amber" type="submit">
          <SearchIcon />
          Search cars
        </Button>
      </form>
      {error && <p className="field__error" role="alert">{error}</p>}
      <p className={styles.disclosure}>A demo marketplace, made for exploring. No real charges. No live location tracking.</p>
    </section>
  );
}
