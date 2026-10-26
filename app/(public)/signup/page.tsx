import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUpClient } from "@/components/auth/SignUpClient";
import { Loading } from "@/components/ui/Notice";

export const metadata: Metadata = { title: "Create a demo account", description: "Create a demo Sheggar Wheels account in a few short steps.", robots: { index: false } };

export default function SignUpPage() {
  return (
    <div className="page page--narrow">
      <Suspense fallback={<Loading label="Loading sign-up…" />}>
        <SignUpClient />
      </Suspense>
    </div>
  );
}
