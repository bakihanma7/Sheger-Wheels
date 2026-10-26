import type { ReactNode } from "react";
import { BRAND } from "@/lib/brand";

/** React 19 hoists <title> into <head>, so private client pages still get a descriptive document title. */
export function PageHeader({ title, sub, actions, eyebrow }: { title: string; sub?: ReactNode; actions?: ReactNode; eyebrow?: string }) {
  return (
    <header className="row row--between" style={{ alignItems: "flex-end" }}>
      <title>{`${title} · ${BRAND.name}`}</title>
      <div className="stack stack--sm">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </header>
  );
}
