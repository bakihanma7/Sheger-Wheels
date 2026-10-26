import Link from "next/link";
import { BRAND } from "@/lib/brand";
import styles from "./layout.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.footerBrand}>
        {BRAND.mark} {BRAND.name}
      </p>
      <div className={styles.footerRow}>
        <Link href="/cars">Browse cars</Link>·<Link href="/#how-it-works">How it works</Link>·<Link href="/owner/cars/new">List your car</Link>
      </div>
      <div className={styles.footerRow}>
        <Link href="/checks">Safety checks</Link>·<span>Terms and privacy are placeholders in this demo</span>
      </div>
      <p>
        © {BRAND.year} {BRAND.name} · Demo only. No real charge. Car locations are sample coordinates.
      </p>
    </footer>
  );
}
