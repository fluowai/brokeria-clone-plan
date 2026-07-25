import { useState } from "react";
import { useLocale } from "@/lib/i18n";

export function Faq() {
  const { t } = useLocale();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center font-display text-3xl font-semibold sm:text-4xl">{t.faq.title}</h2>
        <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-surface">
          {t.faq.items.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="font-medium">{f.q}</span>
                  <span className={`grid h-6 w-6 flex-none place-items-center rounded-full border border-border text-lg transition ${isOpen ? "rotate-45 bg-primary text-primary-foreground" : ""}`}>+</span>
                </button>
                {isOpen && <p className="px-5 pb-5 text-sm text-muted-foreground">{f.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
