import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { query, one } from "./db.server";
import { requireAuth } from "./auth-middleware";

export const getBilling = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const sub = await one<any>(
      `SELECT s.*, p.code AS plan_code, p.name AS plan_name, p.price_cents, p.credits
       FROM subscriptions s LEFT JOIN billing_plans p ON p.id = s.plan_id
       WHERE s.tenant_id=$1`,
      [context.auth.tid],
    );
    const credits = await one<{ sum: number }>(
      "SELECT COALESCE(SUM(delta),0)::int AS sum FROM credit_ledger WHERE tenant_id=$1",
      [context.auth.tid],
    );
    const plans = await query("SELECT * FROM billing_plans ORDER BY price_cents ASC");
    const invoices = await query(
      `SELECT i.id, i.amount_cents, i.status, i.paid_at, i.created_at, p.name AS plan_name
       FROM invoices i LEFT JOIN billing_plans p ON p.id=i.plan_id
       WHERE i.tenant_id=$1 ORDER BY i.created_at DESC LIMIT 50`,
      [context.auth.tid],
    );
    return {
      subscription: sub,
      credits: credits?.sum ?? 0,
      plans: plans.rows,
      invoices: invoices.rows,
    };
  });

export const subscribeToPlan = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ planCode: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const plan = await one<any>("SELECT * FROM billing_plans WHERE code=$1", [data.planCode]);
    if (!plan) throw new Error("Plano inexistente");
    await query(
      `INSERT INTO subscriptions(tenant_id, plan_id, status, current_period_end)
       VALUES($1,$2,'active', now() + interval '30 days')
       ON CONFLICT (tenant_id) DO UPDATE SET plan_id=EXCLUDED.plan_id, status='active',
         current_period_end=EXCLUDED.current_period_end, canceled_at=NULL`,
      [context.auth.tid, plan.id],
    );
    await query(
      "INSERT INTO invoices(tenant_id, plan_id, amount_cents, status, paid_at) VALUES($1,$2,$3,'paid', now())",
      [context.auth.tid, plan.id, plan.price_cents],
    );
    await query(
      "INSERT INTO credit_ledger(tenant_id, delta, reason) VALUES($1,$2,$3)",
      [context.auth.tid, plan.credits, `plan:${plan.code}`],
    );
    return { ok: true };
  });

export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await query(
      "UPDATE subscriptions SET status='canceled', canceled_at=now() WHERE tenant_id=$1",
      [context.auth.tid],
    );
    return { ok: true };
  });

export const topUpCredits = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ credits: z.number().int().min(1), amountCents: z.number().int().min(0) }).parse(d))
  .handler(async ({ data, context }) => {
    await query(
      "INSERT INTO credit_ledger(tenant_id, delta, reason) VALUES($1,$2,'topup')",
      [context.auth.tid, data.credits],
    );
    await query(
      "INSERT INTO invoices(tenant_id, amount_cents, status, paid_at) VALUES($1,$2,'paid', now())",
      [context.auth.tid, data.amountCents],
    );
    return { ok: true };
  });
