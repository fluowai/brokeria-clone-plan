import { useState } from "react";
import { useLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/dictionaries";

const LOCALES: { code: Locale; flag: string; label: string }[] = [
  { code: "pt", flag: "🇧🇷", label: "PT" },
  { code: "en", flag: "🇺🇸", label: "EN" },
  { code: "es", flag: "🇪🇸", label: "ES" },
];

export function Header() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-black">S</span>
          <span className="font-display text-lg font-semibold tracking-tight">SquadIA</span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            { href: "#agents", label: t.nav.agent },
            { href: "#fronts", label: t.nav.agency },
            { href: "#cockpit", label: t.nav.developer },
            { href: "#pricing", label: t.nav.pricing },
            { href: "#faq", label: t.nav.faq },
          ].map((l) => (
            <a key={l.href} href={l.href} className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden overflow-hidden rounded-full border border-border sm:flex">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLocale(l.code)}
                className={`px-2.5 py-1 text-xs font-medium transition ${
                  locale === l.code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label={`${l.label} ${l.flag}`}
              >
                <span className="mr-1">{l.flag}</span>
                {l.label}
              </button>
            ))}
          </div>
          <a href="/auth" className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground md:inline-block">
            Entrar
          </a>
          <a href="#trial" className="hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 md:inline-block">
            {t.nav.trial}
          </a>
          <button className="md:hidden rounded-md border border-border p-2" onClick={() => setOpen((o) => !o)} aria-label="menu">
            <div className="flex h-4 w-5 flex-col justify-between">
              <span className="h-0.5 w-full bg-foreground" />
              <span className="h-0.5 w-full bg-foreground" />
              <span className="h-0.5 w-full bg-foreground" />
            </div>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border md:hidden">
          <div className="flex flex-col p-3">
            {[
              { href: "#agents", label: t.nav.agent },
              { href: "#pricing", label: t.nav.pricing },
              { href: "#faq", label: t.nav.faq },
              { href: "#trial", label: t.nav.trial },
            ].map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm">
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
