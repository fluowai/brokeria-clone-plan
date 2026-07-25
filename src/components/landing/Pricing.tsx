import { useLocale } from "@/lib/i18n";

export function Pricing() {
  const { t } = useLocale();
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t.pricing.title}</h2>
          <p className="mt-3 text-muted-foreground">{t.pricing.subtitle}</p>
          <p className="mt-2 text-xs text-muted-foreground">{t.pricing.autonomous}</p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {t.pricing.plans.map((p) => {
            const featured = !!p.highlight;
            return (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  featured ? "border-primary bg-surface glow" : "border-border bg-surface"
                }`}
              >
                {featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary-foreground">
                    {p.highlight}
                  </span>
                )}
                <h3 className="font-display text-2xl font-bold">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold">{p.price}</span>
                  <span className="text-muted-foreground">{t.pricing.monthly}</span>
                </div>
                <a
                  href="#trial"
                  className={`mt-6 rounded-full py-2.5 text-center text-sm font-semibold transition ${
                    featured ? "bg-primary text-primary-foreground hover:brightness-110" : "border border-border bg-background hover:bg-surface-2"
                  }`}
                >
                  {p.cta}
                </a>
                <div className="mt-6 space-y-4 text-sm">
                  <ul className="space-y-2">
                    {p.agents.map((a) => (
                      <li key={a} className="flex gap-2">
                        <Check /> <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="h-px bg-border" />
                  <ul className="space-y-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check /> <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="h-px bg-border" />
                  <ul className="space-y-2 text-muted-foreground">
                    {p.quotas.map((q) => (
                      <li key={q} className="flex gap-2">
                        <Dot /> <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-6 text-center">
          <h4 className="font-display text-lg font-semibold">{t.pricing.enterprise.title}</h4>
          <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">{t.pricing.enterprise.body}</p>
          <a href="#trial" className="mt-4 inline-block rounded-full border border-border bg-background px-5 py-2 text-sm font-medium hover:bg-surface-2">
            {t.pricing.enterprise.cta}
          </a>
        </div>
      </div>
    </section>
  );
}

function Check() {
  return (
    <svg className="mt-0.5 h-4 w-4 flex-none text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}
function Dot() {
  return <span className="mt-2 h-1 w-1 flex-none rounded-full bg-muted-foreground" />;
}
