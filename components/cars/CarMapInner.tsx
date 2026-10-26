"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";

export interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
}

/**
 * Browser-only Leaflet map (loaded via next/dynamic with ssr:false).
 * External dependency: OpenStreetMap raster tiles (https://tile.openstreetmap.org). See BOUNDARY.md.
 * `active` highlights one point (used by the simulated trip marker).
 */
export default function CarMapInner({ points, active = 0, zoom = 14, showRoute = false, label }: { points: MapPoint[]; active?: number; zoom?: number; showRoute?: boolean; label: string }) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!el.current || mapRef.current || points.length === 0) return;
    const map = L.map(el.current, { scrollWheelZoom: false }).setView([points[active].lat, points[active].lng], zoom);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(map);
    const icon = L.divIcon({ className: "", html: '<div class="map-pin"></div>', iconSize: [28, 28], iconAnchor: [14, 28] });
    if (showRoute && points.length > 1) {
      L.polyline(points.map((p) => [p.lat, p.lng] as [number, number]), { color: "#0b5048", weight: 4, dashArray: "6 8" }).addTo(map);
      map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])), { padding: [32, 32] });
    }
    markerRef.current = L.marker([points[active].lat, points[active].lng], { icon, title: points[active].label ?? label }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const p = points[active];
    if (p && markerRef.current && mapRef.current) markerRef.current.setLatLng([p.lat, p.lng]);
  }, [active, points]);

  return <div ref={el} className="map" role="img" aria-label={label} />;
}
