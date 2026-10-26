import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInClient } from "@/components/auth/SignInClient";
import { Loading } from "@/components/ui/Notice";

export const metadata: Metadata = { title: "Sign in", description: "Sign in to the Sheggar Wheels demo with your email or phone number.", robots: { index: false } };

export default function SignInPage() {
  return (
    <div className="page page--narrow">
      <Suspense fallback={<Loading label="Loading sign-in…" />}>
        <SignInClient />
      </Suspense>
    </div>
  );
}
