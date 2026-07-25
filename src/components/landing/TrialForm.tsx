import { useState, type FormEvent } from "react";
import { useLocale } from "@/lib/i18n";

export function TrialForm() {
  const { t } = useLocale();
  const [state, setState] = useState<"idle" | "success" | "error">("idle");

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const leads = JSON.parse(localStorage.getItem("squadia.leads") || "[]");
      leads.push({ ...Object.fromEntries(form.entries()), createdAt: new Date().toISOString() });
      localStorage.setItem("squadia.leads", JSON.stringify(leads));
      setState("success");
      e.currentTarget.reset();
    } catch {
      setState("error");
    }
  }

  return (
    <section id="trial" className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="rounded-3xl border border-primary/30 bg-gradient-to-b from-surface to-background p-8 sm:p-12 glow">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t.trial.title}</h2>
            <p className="mt-3 text-muted-foreground">{t.trial.subtitle}</p>
          </div>

          <form onSubmit={onSubmit} className="mx-auto mt-10 grid max-w-xl gap-4 sm:grid-cols-2">
            <Field name="name" label={t.trial.name} required />
            <Field name="company" label={t.trial.company} required />
            <Field name="email" label={t.trial.email} type="email" required />
            <Field name="phone" label={t.trial.phone} required />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t.trial.role}</label>
              <select name="role" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" required>
                {t.trial.roles.map((r, i) => (
                  <option key={r} value={i === 0 ? "" : r} disabled={i === 0}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="sm:col-span-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
              {t.trial.submit}
            </button>
            <p className="sm:col-span-2 text-center text-xs text-muted-foreground">{t.trial.disclaimer}</p>

            {state === "success" && (
              <div className="sm:col-span-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-center text-sm text-success">
                {t.trial.success}
              </div>
            )}
            {state === "error" && (
              <div className="sm:col-span-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
                {t.trial.error}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"
      />
    </label>
  );
}
