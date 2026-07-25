import { useLocale } from "@/lib/i18n";
import squadHero from "@/assets/squad-hero.jpg";

export function Hero() {
  const { t } = useLocale();
  return (
    <section id="top" className="relative overflow-hidden grid-bg">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:py-32">
        <div className="flex flex-col justify-center">
          <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t.hero.eyebrow}
          </span>
          <h1 className="text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {t.hero.title}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">{t.hero.subtitle}</p>

          <div className="mt-6 flex items-center gap-2 text-sm text-foreground/90">
            <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 12l5 5L20 6" /></svg>
            {t.hero.bullet}
          </div>

          <p className="mt-4 max-w-xl text-sm text-muted-foreground">{t.hero.body}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#trial" className="glow rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
              {t.hero.cta}
            </a>
            <a href="#cockpit" className="rounded-full border border-border bg-surface px-5 py-3 text-sm font-medium text-foreground transition hover:bg-surface-2">
              {t.hero.ctaGhost}
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {t.hero.trustA}
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {t.hero.trustB}
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-primary/25 to-accent/10 blur-2xl" aria-hidden />
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-surface">
            <img
              src={squadHero}
              alt="Squad SquadIA"
              width={1600}
              height={1200}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/95 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-border bg-background/70 px-4 py-3 backdrop-blur">
              <div className="text-xs">
                <div className="font-semibold">BIA · DONNA · PIXEL · JOTA</div>
                <div className="text-muted-foreground">LINK · CARTA · BRAIN</div>
              </div>
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">24/7</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
