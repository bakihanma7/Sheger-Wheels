"use client";

import Image from "next/image";
import { useState } from "react";

/** next/image with a graceful fallback if the photo fails to load. Demo SVGs skip the optimizer. */
export function CarImage({ src, alt, priority, sizes = "(max-width: 720px) 100vw, 420px" }: { src?: string; alt: string; priority?: boolean; sizes?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div role="img" aria-label={`${alt} (photo unavailable)`} style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "var(--c-mint)", color: "var(--c-muted)", fontSize: 13 }}>
        Photo unavailable
      </div>
    );
  }
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} unoptimized={src.endsWith(".svg")} onError={() => setFailed(true)} />;
}
