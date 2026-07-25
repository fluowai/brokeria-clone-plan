import { useLocale } from "@/lib/i18n";

export function Footer() {
  const { t } = useLocale();
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-black">S</span>
          <span className="font-display text-lg font-semibold">SquadIA</span>
        </div>
        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} SquadIA. {t.footer.rights}</div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <a href="#pricing" className="hover:text-foreground">{t.footer.product}</a>
          <a href="#faq" className="hover:text-foreground">{t.footer.company}</a>
          <a href="#trial" className="hover:text-foreground">{t.footer.contact}</a>
        </div>
      </div>
    </footer>
  );
}
