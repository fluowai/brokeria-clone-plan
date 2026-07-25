import { createServerFn } from "@tanstack/react-start";
import { requireSuperAdmin } from "./auth-middleware";
import { query, one } from "./db.server";

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .handler(async () => {
    const tenants = await query(
      `SELECT t.id, t.name, t.slug, t.created_at,
        (SELECT COUNT(*) FROM users WHERE tenant_id=t.id)::int AS users,
        (SELECT COUNT(*) FROM leads WHERE tenant_id=t.id)::int AS leads,
        (SELECT COUNT(*) FROM properties WHERE tenant_id=t.id)::int AS properties,
        (SELECT COALESCE(SUM(delta),0) FROM credit_ledger WHERE tenant_id=t.id)::int AS credits,
        (SELECT p.name FROM subscriptions s LEFT JOIN billing_plans p ON p.id=s.plan_id WHERE s.tenant_id=t.id) AS plan
       FROM tenants t ORDER BY t.created_at DESC`,
    );
    const totals = await one<any>(
      `SELECT
         (SELECT COUNT(*) FROM tenants)::int AS tenants,
         (SELECT COUNT(*) FROM users)::int AS users,
         (SELECT COUNT(*) FROM leads)::int AS leads,
         (SELECT COUNT(*) FROM properties)::int AS properties,
         (SELECT COALESCE(SUM(amount_cents),0) FROM invoices WHERE status='paid')::int AS revenue_cents`,
    );
    return { tenants: tenants.rows, totals };
  });
