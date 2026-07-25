import { useLocale } from "@/lib/i18n";

export function Fronts() {
  const { t } = useLocale();
  return (
    <section id="fronts" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t.fronts.title}</h2>
          <p className="mt-3 text-muted-foreground">{t.fronts.subtitle}</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {t.fronts.items.map((f, i) => (
            <div key={f.title} className="flex flex-col rounded-2xl border border-border bg-surface p-6">
              <div className="mb-4 font-display text-xs text-primary">0{i + 1}</div>
              <h3 className="font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {f.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-primary" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary">{f.punch}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
