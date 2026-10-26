"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getBookings, getBooking, getCars, getUsers } from "@/lib/db";
import { safeReturnPath } from "@/lib/auth";
import { canViewBooking, createBookingRequest, transitionBooking, updateCar } from "@/lib/domain";
import { addDays, todayISO } from "@/lib/format";

interface Row { id: string; title: string; expected: string; actual: string; pass: boolean | null }

export function ChecksClient() {
  const [rows, setRows] = useState<Row[]>([]);

  function run() {
    const out: Row[] = [];
    const bookings = getBookings();
    const users = getUsers();
    const cars = getCars();

    // 1. Signed-out write attempt
    const before = getBookings().length;
    const r1 = createBookingRequest(null, { carId: cars.find((c) => c.status === "approved")?.id ?? "x", startDate: addDays(todayISO(), 60), endDate: addDays(todayISO(), 62) });
    const after = getBookings().length;
    out.push({ id: "1", title: "Signed-out booking attempt", expected: "“Not signed in”, no booking created", actual: `${r1.ok ? "created!" : r1.error}; bookings ${before} → ${after}`, pass: !r1.ok && r1.error === "Not signed in" && before === after });

    // 2. Cross-user ownership attempt
    const target = bookings.find((b) => b.status === "requested" || b.status === "confirmed");
    const stranger = target && users.find((u) => u.roles.includes("renter") && u.status === "active" && u.id !== target.renterId && u.id !== target.ownerId);
    if (target && stranger) {
      const snap = JSON.stringify(target);
      const r2 = transitionBooking(stranger.id, target.id, "cancel");
      out.push({ id: "2", title: `${stranger.name} tries to cancel a booking owned by someone else`, expected: "“Not yours”, no data change", actual: `${r2.ok ? "cancelled!" : r2.error}; record ${JSON.stringify(getBooking(target.id)) === snap ? "unchanged" : "CHANGED"}`, pass: !r2.ok && r2.error === "Not yours" && JSON.stringify(getBooking(target.id)) === snap });
    } else out.push({ id: "2", title: "Cross-user cancellation", expected: "“Not yours”", actual: "Skipped: needs an open booking and a second renter in the demo data (try “Reset demo data”).", pass: null });

    // 3. Unsafe return URL
    const probes = ["https://example.com", "//evil.example", "/\\evil.example", "javascript:alert(1)"];
    const results = probes.map((p) => safeReturnPath(p));
    out.push({ id: "3", title: "Unsafe return URL (/signin?next=https://example.com)", expected: "Redirect to “/”, never the external site", actual: probes.map((p, i) => `${p} → ${results[i]}`).join("  |  "), pass: results.every((x) => x === "/") });

    // Extras from the brief
    const car = cars.find((c) => c.status === "approved");
    const notOwner = car && users.find((u) => u.roles.includes("owner") && u.id !== car.ownerId);
    if (car && notOwner) {
      const r4 = updateCar(notOwner.id, car.id, { make: "Hacked", model: "X", year: 2020, transmission: "Manual", fuel: "Petrol", seats: 4, neighbourhood: "Bole", pricePerDay: 1000, description: "Attempted edit by another owner", photos: ["/cars/car-1.svg"] });
      out.push({ id: "4", title: `${notOwner.name} tries to edit someone else's car by id`, expected: "“Not yours”", actual: r4.ok ? "edited!" : r4.error, pass: !r4.ok && r4.error === "Not yours" });
    }
    const anyB = bookings[0];
    const nosy = anyB && users.find((u) => u.roles.includes("renter") && !u.roles.includes("admin") && u.id !== anyB.renterId && u.id !== anyB.ownerId);
    if (anyB && nosy) out.push({ id: "5", title: `${nosy.name} tries to view another renter's booking details`, expected: "Access denied", actual: canViewBooking(nosy, anyB) ? "allowed!" : "denied", pass: !canViewBooking(nosy, anyB) });
    setRows(out);
  }

  return (
    <div className="stack">
      <Button variant="primary" onClick={run}>Run checks</Button>
      {rows.length > 0 && (
        <div className="table-wrap">
          <table className="data">
            <caption>Misuse scenarios and results</caption>
            <thead><tr><th scope="col">Scenario</th><th scope="col">Expected</th><th scope="col">Actual</th><th scope="col">Result</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <th scope="row" style={{ fontWeight: 500 }}>{r.id}. {r.title}</th>
                  <td>{r.expected}</td>
                  <td style={{ wordBreak: "break-word" }}>{r.actual}</td>
                  <td><Badge tone={r.pass === null ? "warn" : r.pass ? "success" : "danger"}>{r.pass === null ? "Skipped" : r.pass ? "Refused ✓" : "FAILED"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
