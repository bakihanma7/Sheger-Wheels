import Link from "next/link";

/** Visible page links + clear current-page indicator. Pass `hrefFor` (URL based) or `onPage` (state based). */
export function Pagination({
  page,
  pages,
  total,
  label,
  hrefFor,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  label: string;
  hrefFor?: (p: number) => string;
  onPage?: (p: number) => void;
}) {
  const nums = Array.from({ length: pages }, (_, i) => i + 1);
  const item = (p: number, text: string, opts: { current?: boolean; disabled?: boolean; aria?: string } = {}) => {
    const cls = "page-link";
    if (onPage)
      return (
        <button type="button" className={cls} aria-current={opts.current ? "page" : undefined} aria-disabled={opts.disabled || undefined} disabled={opts.disabled} aria-label={opts.aria} onClick={() => onPage(p)}>
          {text}
        </button>
      );
    return (
      <Link href={hrefFor!(p)} className={cls} aria-current={opts.current ? "page" : undefined} aria-disabled={opts.disabled || undefined} aria-label={opts.aria} tabIndex={opts.disabled ? -1 : undefined}>
        {text}
      </Link>
    );
  };
  return (
    <nav className="pagination" aria-label={label}>
      <p className="muted small" aria-live="polite">
        {total} result{total === 1 ? "" : "s"} · page {page} of {pages}
      </p>
      {pages > 1 && (
        <ul>
          <li>{item(page - 1, "‹", { disabled: page <= 1, aria: "Previous page" })}</li>
          {nums.map((n) => (
            <li key={n}>{item(n, String(n), { current: n === page, aria: `Page ${n}` })}</li>
          ))}
          <li>{item(page + 1, "›", { disabled: page >= pages, aria: "Next page" })}</li>
        </ul>
      )}
    </nav>
  );
}
