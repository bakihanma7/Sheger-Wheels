"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { signOut, hasRole } from "@/lib/auth";
import { useSession } from "@/lib/hooks";
import { Button } from "@/components/ui/Button";
import { NotificationsMenu } from "./NotificationsMenu";
import styles from "./layout.module.css";

export function SiteNav() {
  const session = useSession();
  const router = useRouter();
  const user = session.user;

  function onSignOut() {
    signOut(); // clears sessionStorage session keys
    router.push("/");
  }

  return (
    <header className={styles.nav}>
      <Link href="/" className={styles.brand}>
        {BRAND.mark} {BRAND.name}
      </Link>
      <nav className={styles.links} aria-label="Primary">
        <Link href="/cars">Browse cars</Link>
        <Link href="/#how-it-works">How it works</Link>
        {user && <Link href="/dashboard">Dashboard</Link>}
        {user && <Link href="/bookings">My bookings</Link>}
        {hasRole(user, "owner") && <Link href="/owner">Owner</Link>}
        {hasRole(user, "admin") && <Link href="/admin">Admin</Link>}
      </nav>
      <div className={styles.auth}>
        {session.status === "signed-in" && user ? (
          <>
            <NotificationsMenu user={user} />
            <span className="small muted" aria-label="Signed in as">{user.name.split(" ")[0]}</span>
            <Button variant="secondary" onClick={onSignOut}>
              Sign out
            </Button>
          </>
        ) : session.status === "loading" ? (
          <span className="sr-only">Loading account</span>
        ) : (
          <>
            <Link href="/signin">Sign in</Link>
            <Button href="/signup" variant="primary">
              Sign up
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
