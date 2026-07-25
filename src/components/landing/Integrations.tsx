import { useLocale } from "@/lib/i18n";

export function Integrations() {
  const { t } = useLocale();
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t.integrations.title}</h2>
          <p className="mt-3 text-muted-foreground">{t.integrations.subtitle}</p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {t.integrations.items.map((i) => (
            <div key={i.name} className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
              <div>
                <div className="font-display font-semibold">{i.name}</div>
                <div className="text-xs text-muted-foreground">{i.kind}</div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  i.status === "live" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {i.status === "live" ? t.integrations.live : t.integrations.loading}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
