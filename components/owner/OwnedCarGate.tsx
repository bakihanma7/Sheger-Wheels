import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState, Loading, Notice } from "@/components/ui/Notice";

export function OwnedCarGate({ status, children }: { status: "loading" | "missing" | "forbidden" | "ok"; children: ReactNode }) {
  if (status === "loading") return <Loading />;
  if (status === "missing") return <EmptyState title="Car not found" action={<Link href="/owner/cars" className="btn btn--primary">My cars</Link>}>It may have been removed, or the link is wrong.</EmptyState>;
  if (status === "forbidden")
    return (
      <div className="stack">
        <Notice tone="error" title="Not yours.">This car belongs to another owner, so you can't view or change it.</Notice>
        <p><Link href="/owner/cars" className="btn btn--primary">Back to my cars</Link></p>
      </div>
    );
  return <>{children}</>;
}
