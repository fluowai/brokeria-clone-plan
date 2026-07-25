import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { dict, type Locale, type Dict } from "./dictionaries";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
};

const LocaleContext = createContext<Ctx | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  // SSR + first client render use "pt" to avoid hydration mismatch.
  const [locale, setLocaleState] = useState<Locale>("pt");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("squadia.locale") as Locale | null;
      if (saved && saved in dict) {
        setLocaleState(saved);
        return;
      }
      const nav = navigator.language.slice(0, 2).toLowerCase();
      if (nav === "en" || nav === "es") setLocaleState(nav);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem("squadia.locale", l);
    } catch {
      /* noop */
    }
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: dict[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
