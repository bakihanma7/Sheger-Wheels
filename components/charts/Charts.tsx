"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const brand = "#0b5048";
const fmt = (n: number) => `ETB ${Math.round(n).toLocaleString("en-US")}`;

/** Chart + the same numbers as an accessible table (charts alone aren't accessible). */
function Wrap({ title, children, rows, head }: { title: string; children: React.ReactNode; rows: [string, string][]; head: [string, string] }) {
  return (
    <figure style={{ margin: 0 }} className="stack stack--sm">
      <figcaption className="h3">{title}</figcaption>
      <div style={{ height: 260 }} role="img" aria-label={`${title}. Data table follows.`}>
        {children}
      </div>
      <details>
        <summary className="small" style={{ minHeight: 44, display: "flex", alignItems: "center", cursor: "pointer" }}>View as table</summary>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th scope="col">{head[0]}</th><th scope="col" className="num">{head[1]}</th></tr></thead>
            <tbody>{rows.map(([a, b]) => <tr key={a}><th scope="row" style={{ fontWeight: 500 }}>{a}</th><td className="num">{b}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

export function EarningsChart({ data, title = "Earnings by month" }: { data: { month: string; earnings: number }[]; title?: string }) {
  return (
    <Wrap title={title} head={["Month", "Earnings"]} rows={data.map((d) => [d.month, fmt(d.earnings)])}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dce4e0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={44} />
          <Tooltip formatter={(v) => fmt(Number(v))} />
          <Line type="monotone" dataKey="earnings" stroke={brand} strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </Wrap>
  );
}

export function CountBarChart({ data, title }: { data: { label: string; value: number }[]; title: string }) {
  return (
    <Wrap title={title} head={["Status", "Bookings"]} rows={data.map((d) => [d.label, String(d.value)])}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dce4e0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={56} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
          <Tooltip />
          <Bar dataKey="value" fill={brand} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Wrap>
  );
}

export function VolumeBarChart({ data, title }: { data: { month: string; volume: number }[]; title: string }) {
  return (
    <Wrap title={title} head={["Month", "Booking volume"]} rows={data.map((d) => [d.month, fmt(d.volume)])}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dce4e0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={44} />
          <Tooltip formatter={(v) => fmt(Number(v))} />
          <Bar dataKey="volume" fill="#f6bc58" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Wrap>
  );
}
