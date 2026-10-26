import type { ReactNode } from "react";

export function Notice({ tone = "info", children, title }: { tone?: "info" | "success" | "warn" | "error"; children: ReactNode; title?: string }) {
  return (
    <div className={`notice notice--${tone}`} role={tone === "error" ? "alert" : "status"}>
      {title && <strong>{title} </strong>}
      {children}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Loading({ label = "Loading…", rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div role="status" aria-live="polite" className="stack stack--sm">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton" style={{ height: 24, width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}
