"use client";

import { useEffect } from "react";
import { initializeDemoData, resetDemoData } from "@/lib/db";
import { getStorageError } from "@/lib/storage";
import { useBookings, useCars, useHydrated, useUsers } from "@/lib/hooks";

/**
 * Seeds demo data once (only for keys that are absent), shows the always-visible "Demo data" label,
 * and surfaces storage problems with a recovery action.
 */
export function DemoBanner() {
  const hydrated = useHydrated();
  // Subscribing re-renders this component after storage changes so the error message stays current.
  useUsers();
  useCars();
  useBookings();

  useEffect(() => {
    initializeDemoData();
  }, []);

  const problem = hydrated ? getStorageError() : null;
  const showReset = process.env.NEXT_PUBLIC_SHOW_RESET !== "false";

  return (
    <div className="demo-banner" role="region" aria-label="Demo notice">
      <span className="tag">Demo data</span>
      <span>Everything here is simulated: fictional people, mock payments, no live tracking.</span>
      {problem && <span role="alert">⚠ {problem}</span>}
      {showReset && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Reset all demo data to the original seed and sign out?")) {
              resetDemoData();
              window.location.assign("/");
            }
          }}
        >
          Reset demo data (dev)
        </button>
      )}
    </div>
  );
}
