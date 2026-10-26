"use client";

import { useMemo, useState, type ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Provide to make the column sortable. */
  sortValue?: (row: T) => string | number;
  numeric?: boolean;
}

/** Accessible table: caption, scoped headers, aria-sort and real buttons for sortable columns. */
export function DataTable<T>({
  caption,
  rows,
  columns,
  rowKey,
  empty,
  initialSort,
}: {
  caption: string;
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
  initialSort?: { key: string; dir: "asc" | "desc" };
}) {
  const [sort, setSort] = useState(initialSort ?? null);
  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort?.key);
    if (!sort || !col?.sortValue) return rows;
    const get = col.sortValue;
    return [...rows].sort((a, b) => {
      const x = get(a), y = get(b);
      const r = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return sort.dir === "asc" ? r : -r;
    });
  }, [rows, columns, sort]);

  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="table-wrap">
      <table className="data">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key;
              return (
                <th key={c.key} scope="col" className={c.numeric ? "num" : undefined} aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : c.sortValue ? "none" : undefined}>
                  {c.sortValue ? (
                    <button type="button" className="th-sort" onClick={() => setSort(active && sort!.dir === "asc" ? { key: c.key, dir: "desc" } : { key: c.key, dir: "asc" })}>
                      {c.header}
                      <span aria-hidden="true">{active ? (sort!.dir === "asc" ? "↑" : "↓") : "↕"}</span>
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={rowKey(r)}>
              {columns.map((c, i) => {
                const Cell = i === 0 ? "th" : "td";
                return (
                  <Cell key={c.key} scope={i === 0 ? "row" : undefined} className={c.numeric ? "num" : undefined} style={i === 0 ? { fontWeight: 500, textAlign: "left" } : undefined}>
                    {c.render(r)}
                  </Cell>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
