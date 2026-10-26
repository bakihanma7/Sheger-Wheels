import type { Metadata } from "next";
import { ChecksClient } from "@/components/auth/ChecksClient";

export const metadata: Metadata = { title: "Safety checks", description: "Run the demo's misuse scenarios and see each one refused.", robots: { index: false } };

export default function ChecksPage() {
  return (
    <div className="page page--mid stack">
      <div>
        <h1 className="page-title">Safety checks</h1>
        <p className="page-sub">These run real app functions against the demo data in your browser and show that each misuse attempt is refused. They demonstrate front-end guardrails, not real security.</p>
      </div>
      <ChecksClient />
    </div>
  );
}
