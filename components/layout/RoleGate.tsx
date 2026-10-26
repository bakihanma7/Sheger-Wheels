"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { Role } from "@/lib/types";
import { hasRole, isSuspended } from "@/lib/auth";
import { useSession } from "@/lib/hooks";
import { Loading, Notice } from "@/components/ui/Notice";
import { Button } from "@/components/ui/Button";

/**
 * Frontend route guard. Checks: demo session exists → account not suspended → has the required role.
 * Signed-out visitors are sent to /signin?next=<where they were going>. This hides UI only;
 * every write action re-checks session, role, ownership and state in lib/domain.ts.
 */
export function RoleGate({ role, children }: { role: Role; children: ReactNode }) {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session.status === "signed-out") {
      const here = window.location.pathname + window.location.search;
      router.replace(`/signin?next=${encodeURIComponent(here)}`);
    }
  }, [session.status, router]);

  if (session.status === "loading")
    return (
      <div className="page">
        <Loading label="Checking your demo session…" />
      </div>
    );

  if (session.status === "signed-out")
    return (
      <div className="page page--mid">
        <Notice tone="info" title="Please sign in.">
          Redirecting you to the sign-in page…
        </Notice>
      </div>
    );

  const user = session.user;
  if (isSuspended(user))
    return (
      <div className="page page--mid stack">
        <Notice tone="error" title="Access blocked.">
          This demo account is suspended, so demo actions are disabled. Sign out and try another demo account.
        </Notice>
      </div>
    );

  if (!hasRole(user, role))
    return (
      <div className="page page--mid stack">
        <Notice tone="warn" title="This area is for a different role.">
          You're signed in as {user.name} ({user.roles.join(" + ")}), but this page needs the {role} role.
          {role === "owner" && " Sign up with “I also want to list cars” to try the owner tools."}
        </Notice>
        <div className="row">
          <Button href="/dashboard" variant="primary">Go to my dashboard</Button>
          <Link href="/cars" className="btn btn--secondary">Browse cars</Link>
        </div>
      </div>
    );

  return <>{children}</>;
}
