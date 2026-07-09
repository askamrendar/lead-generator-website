import type { BusinessConfig } from '@/lib/generator/schema';

interface Stat {
  value: string;
  label: string;
}

export function Stats({ config }: { config: BusinessConfig }) {
  const stats: Stat[] = [
    config.yearsInBusiness
      ? { value: `${config.yearsInBusiness}+`, label: 'Years in Business' }
      : { value: 'Local', label: 'Family Owned' },
    config.ratingCount
      ? { value: `${config.ratingCount}+`, label: '5-Star Reviews' }
      : { value: '100%', label: 'Satisfaction Focused' },
    { value: '24/7', label: 'Emergency Service' },
    {
      value: `${config.serviceRadiusMiles}mi`,
      label: 'Service Radius',
    },
  ];

  return (
    <section className="border-y border-border bg-muted/40">
      <div className="container grid grid-cols-2 gap-6 py-12 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-3xl font-extrabold text-brand sm:text-4xl">
              {s.value}
            </div>
            <div className="mt-1 text-sm text-muted-fg">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
