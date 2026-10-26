"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/brand";
import { signOut } from "@/lib/auth";
import { useSession } from "@/lib/hooks";
import { Button } from "@/components/ui/Button";
import { RoleGate } from "./RoleGate";
import { NotificationsMenu } from "./NotificationsMenu";

const OWNER_LINKS: [string, string][] = [
  ["/owner", "Overview"],
  ["/owner/cars", "My cars"],
  ["/owner/cars/new", "Add a car"],
  ["/owner/earnings", "Earnings"],
  ["/owner/reviews", "Reviews"],
  ["/owner/disputes", "Disputes"],
];
const ADMIN_LINKS: [string, string][] = [
  ["/admin", "Overview"],
  ["/admin/listings", "Listings"],
  ["/admin/users", "Users"],
  ["/admin/bookings", "Bookings"],
  ["/admin/disputes", "Disputes"],
  ["/admin/reports", "Reports"],
  ["/admin/announcements", "Announcements"],
];

function Shell({ variant, children }: { variant: "owner" | "admin"; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSession();
  const links = variant === "owner" ? OWNER_LINKS : ADMIN_LINKS;
  // Exact match for index pages; prefix match for the rest (but not when a longer link also matches).
  const current = links
    .map(([href]) => href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <>
      <header className="workspace-top">
        <Link href="/" style={{ fontSize: 22, fontWeight: 600, color: "var(--c-brand)" }}>
          {BRAND.mark} {BRAND.name} <span className="muted small" style={{ fontWeight: 400 }}>· {variant === "owner" ? "Owner workspace" : "Admin"}</span>
        </Link>
        <div className="row">
          {user && <NotificationsMenu user={user} />}
          <span className="small muted">{user?.name}</span>
          <Button variant="secondary" onClick={() => { signOut(); router.push("/"); }}>
            Sign out
          </Button>
        </div>
      </header>
      <div className="workspace">
        <nav className="sidebar" aria-label={`${variant} navigation`}>
          {links.map(([href, label]) => (
            <Link key={href} href={href} aria-current={href === current ? "page" : undefined}>
              {label}
            </Link>
          ))}
          <p className="group">Elsewhere</p>
          <Link href="/cars">Public site</Link>
          <Link href="/dashboard">Renter dashboard</Link>
        </nav>
        <main id="main" className="workspace-main">
          {children}
        </main>
      </div>
    </>
  );
}

export function WorkspaceShell({ variant, children }: { variant: "owner" | "admin"; children: ReactNode }) {
  return (
    <RoleGate role={variant}>
      <Shell variant={variant}>{children}</Shell>
    </RoleGate>
  );
}
