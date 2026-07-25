import { useLocale } from "@/lib/i18n";

export function Cockpit() {
  const { t } = useLocale();
  return (
    <section id="cockpit" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-display text-3xl font-semibold sm:text-4xl">{t.cockpit.title}</h2>
          <p className="mt-3 text-muted-foreground">{t.cockpit.subtitle}</p>
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl shadow-black/40">
          {/* Fake browser chrome */}
          <div className="flex items-center gap-2 border-b border-border bg-background/60 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
            <div className="ml-4 flex-1 rounded-md bg-surface-2 px-3 py-1 text-xs text-muted-foreground">
              🔒 app.squadia.com/cockpit
            </div>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-3">
            {/* Left: header + stats */}
            <div className="md:col-span-2 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-muted-foreground">{t.cockpit.date}</div>
                  <h3 className="font-display text-xl font-semibold">{t.cockpit.ownerLabel}</h3>
                </div>
                <div className="flex overflow-hidden rounded-full border border-border">
                  {t.cockpit.tabs.map((tab, i) => (
                    <button
                      key={tab}
                      className={`px-3 py-1 text-xs ${i === 2 ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                {t.cockpit.stats.map((s) => (
                  <div key={s.label} className="rounded-xl border border-border bg-background/60 p-4">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
                    <div className="mt-2 font-display text-3xl font-bold">{s.value}</div>
                    <div className="mt-1 text-[11px] text-primary">{s.hint}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-border bg-background/60 p-4">
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t.cockpit.financials}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">ROI 4.0x</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FinCell label={t.cockpit.vgv} value="R$ 4.0M" />
                  <FinCell label={t.cockpit.vgc} value="R$ 185K" />
                  <FinCell label={t.cockpit.roi} value="4.0x" />
                </div>
                {/* mini bar chart */}
                <div className="mt-5 flex h-24 items-end gap-2">
                  {[35, 55, 42, 68, 80, 72, 92, 60, 88, 74, 96, 84].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-primary/40 to-primary" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Right: bottlenecks + goals */}
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <div className="mb-3 text-xs text-muted-foreground">{t.cockpit.bottlenecks}</div>
                {[
                  { l: "Pre SLA", v: "38", tone: "warning" },
                  { l: "+72h", v: "3", tone: "destructive" },
                  { l: "Viewings", v: "5", tone: "primary" },
                ].map((row) => (
                  <div key={row.l} className="flex items-center justify-between border-t border-border/50 py-2 text-sm first:border-t-0">
                    <span className="text-muted-foreground">{row.l}</span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                        row.tone === "warning" ? "bg-warning/15 text-warning" : row.tone === "destructive" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"
                      }`}
                    >
                      {row.v}
                    </span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t.cockpit.goals}</span>
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-success">🏆</span>
                </div>
                {[
                  { l: "Sales", cur: 14, max: 10 },
                  { l: "Bookings", cur: 98, max: 64 },
                  { l: "Leads", cur: 265, max: 320 },
                ].map((g) => {
                  const pct = Math.min(100, (g.cur / g.max) * 100);
                  return (
                    <div key={g.l} className="mb-3 last:mb-0">
                      <div className="mb-1 flex justify-between text-xs">
                        <span>{g.l}</span>
                        <span className="text-muted-foreground">{g.cur}/{g.max}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-semibold">{value}</div>
    </div>
  );
}
