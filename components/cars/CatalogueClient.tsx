"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, SelectField } from "@/components/ui/Field";
import { EmptyState, Loading, Notice } from "@/components/ui/Notice";
import { Pagination } from "@/components/ui/Pagination";
import { CarCard } from "./CarCard";
import { NEIGHBOURHOODS, validateDates } from "@/lib/domain";
import { useBookings, useCars, useHydrated, useReviews } from "@/lib/hooks";
import { PAGE_SIZE, carRating, catalogueQueryToParams, filterCars, paginate, parseCatalogueQuery, tripCount, type SortKey } from "@/lib/selectors";
import { todayISO } from "@/lib/format";
import { getStorageError } from "@/lib/storage";

export function CatalogueClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const hydrated = useHydrated();
  const cars = useCars();
  const bookings = useBookings();
  const reviews = useReviews();
  const q = useMemo(() => parseCatalogueQuery(new URLSearchParams(sp.toString())), [sp]);

  const filtered = useMemo(() => filterCars(cars, bookings, q), [cars, bookings, q]);
  const view = paginate(filtered, q.page);
  const dateError = q.start || q.end ? validateDates(q.start, q.end) : null;
  const hasFilters = !!(q.q || q.neighbourhood || q.minPrice !== null || q.maxPrice !== null || q.transmission || q.minSeats !== null || q.start || q.end);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    const n = (k: string) => (get(k).trim() === "" ? null : Number(get(k)));
    const next = catalogueQueryToParams({
      q: get("q").trim(),
      neighbourhood: get("neighbourhood"),
      minPrice: n("minPrice"),
      maxPrice: n("maxPrice"),
      transmission: get("transmission") as "" | "Automatic" | "Manual",
      minSeats: n("minSeats"),
      start: get("start"),
      end: get("end"),
      sort: get("sort") as SortKey,
      page: 1, // changing filters always returns to page 1
    });
    router.push(`/cars${next.size ? `?${next}` : ""}`);
  }

  const hrefFor = (page: number) => {
    const p = catalogueQueryToParams({ ...q, page });
    return `/cars${p.size ? `?${p}` : ""}`;
  };

  return (
    <div className="split" style={{ gridTemplateColumns: "280px minmax(0,1fr)" }}>
      <form className="panel stack stack--sm" onSubmit={onSubmit} key={sp.toString()} aria-label="Filter cars" noValidate>
        <h2 className="h3">Filters</h2>
        <Field id="q" label="Search make or model" type="search" defaultValue={q.q} placeholder="e.g. Toyota" />
        <SelectField id="neighbourhood" label="Neighbourhood" defaultValue={q.neighbourhood}>
          <option value="">Any</option>
          {Object.keys(NEIGHBOURHOODS).map((n) => <option key={n}>{n}</option>)}
        </SelectField>
        <div className="field-row">
          <Field id="minPrice" label="Min ETB / day" type="number" min={0} step={100} inputMode="numeric" defaultValue={q.minPrice ?? ""} />
          <Field id="maxPrice" label="Max ETB / day" type="number" min={0} step={100} inputMode="numeric" defaultValue={q.maxPrice ?? ""} />
        </div>
        <SelectField id="transmission" label="Transmission" defaultValue={q.transmission}>
          <option value="">Any</option>
          <option>Automatic</option>
          <option>Manual</option>
        </SelectField>
        <SelectField id="minSeats" label="Minimum seats" defaultValue={q.minSeats ?? ""}>
          <option value="">Any</option>
          {[2, 4, 5, 7, 12].map((n) => <option key={n} value={n}>{n}+</option>)}
        </SelectField>
        <Field id="start" label="Pickup" type="date" min={todayISO()} defaultValue={q.start} />
        <Field id="end" label="Return" type="date" min={todayISO()} defaultValue={q.end} />
        <SelectField id="sort" label="Sort by" defaultValue={q.sort}>
          <option value="popularity">Most popular</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="newest">Newest listings</option>
        </SelectField>
        <Button type="submit" variant="primary" block>Apply filters</Button>
        {hasFilters && <Link href="/cars" className="btn btn--secondary">Clear all filters</Link>}
      </form>

      <section aria-label="Search results" className="stack">
        {getStorageError() && <Notice tone="warn" title="Heads up.">{getStorageError()}</Notice>}
        {dateError && <Notice tone="warn" title="Check your dates.">{dateError} The availability filter is ignored until the dates are valid.</Notice>}
        {!hydrated || (cars.length === 0 && !getStorageError()) ? (
          <Loading label="Loading cars…" rows={5} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No cars match your filters" action={hasFilters ? <Link href="/cars" className="btn btn--primary">Clear filters</Link> : undefined}>
            {hasFilters ? "Try a wider price range, another neighbourhood or different dates." : "There are no approved listings yet. Check back soon."}
          </EmptyState>
        ) : (
          <>
            <p aria-live="polite" className="muted">
              Showing {(view.page - 1) * PAGE_SIZE + 1}–{(view.page - 1) * PAGE_SIZE + view.items.length} of {view.total} cars
            </p>
            <div className="grid-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
              {view.items.map((c) => (
                <CarCard key={c.id} car={c} rating={carRating(c.id, reviews)} trips={tripCount(c.id, bookings)} />
              ))}
            </div>
            <Pagination page={view.page} pages={view.pages} total={view.total} label="Catalogue pages" hrefFor={hrefFor} />
          </>
        )}
      </section>
    </div>
  );
}
