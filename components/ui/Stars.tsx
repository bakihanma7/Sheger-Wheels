export function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="stars" role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {"★".repeat(full)}
      <span style={{ color: "var(--c-border)" }}>{"★".repeat(5 - full)}</span>
    </span>
  );
}
