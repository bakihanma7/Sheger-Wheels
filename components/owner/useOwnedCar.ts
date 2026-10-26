"use client";

import { useParams } from "next/navigation";
import { canManageCar } from "@/lib/domain";
import { useCars, useHydrated, useSession } from "@/lib/hooks";

/** Loads /owner/cars/[id]/… and checks the signed-in owner actually owns it (URL tampering → "forbidden"). */
export function useOwnedCar() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const { user } = useSession();
  const cars = useCars();
  const car = cars.find((c) => c.id === id) ?? null;
  const status: "loading" | "missing" | "forbidden" | "ok" = !hydrated || (cars.length === 0 && !car) ? "loading" : !car ? "missing" : !canManageCar(user, car) ? "forbidden" : "ok";
  return { id, user, car, status };
}
