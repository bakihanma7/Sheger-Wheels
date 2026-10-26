"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "./CarMapInner";

const Inner = dynamic(() => import("./CarMapInner"), {
  ssr: false,
  loading: () => <div className="map" aria-busy="true" />,
});

/**
 * Map + always-visible text fallback. Coordinates are SEEDED SAMPLE locations: the map never implies
 * a vehicle is being tracked.
 */
export function CarMap({ points, active, zoom, showRoute, label, fallback }: { points: MapPoint[]; active?: number; zoom?: number; showRoute?: boolean; label: string; fallback: string }) {
  return (
    <div className="stack stack--sm">
      <Inner points={points} active={active} zoom={zoom} showRoute={showRoute} label={label} />
      <p className="map-fallback">
        <strong>Location:</strong> {fallback} <span className="muted">(sample coordinates, not live)</span>
      </p>
    </div>
  );
}
