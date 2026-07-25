import { useLocale } from "@/lib/i18n";

export function Agents() {
  const { t } = useLocale();
  return (
    <section id="agents" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-balance font-display text-3xl font-semibold sm:text-4xl">{t.agents.title}</h2>
          <p className="mt-3 text-muted-foreground">{t.agents.subtitle}</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.agents.items.map((a, i) => (
            <div
              key={a.name}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 transition hover:bg-surface-2 ${
                i === 0 ? "lg:col-span-2 lg:row-span-2" : ""
              }`}
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 font-display text-sm font-bold text-primary">
                  {a.name.slice(0, 2)}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">AI</span>
              </div>
              <h3 className="font-display text-2xl font-semibold">{a.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{a.role}</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold text-primary">{a.kpi}</span>
                <span className="text-xs text-muted-foreground">{a.kpiLabel}</span>
              </div>
              <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl opacity-0 transition group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
