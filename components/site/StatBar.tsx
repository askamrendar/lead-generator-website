interface Stat {
  value: string;
  label: string;
}

/** Generic stat strip. Feed it any stats (e.g. from content.locationStats). */
export function StatBar({ stats }: { stats: Stat[] }) {
  if (stats.length === 0) return null;
  return (
    <section className="border-y border-border bg-muted/40">
      <div className="container grid grid-cols-2 gap-6 py-10 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl font-extrabold text-brand sm:text-3xl">
              {s.value}
            </div>
            <div className="mt-1 text-xs text-muted-fg sm:text-sm">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
