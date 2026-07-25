import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { query, one } from "./db.server";
import { requireAuth } from "./auth-middleware";

const stages = ["new", "contacted", "qualified", "visit", "proposal", "won", "lost"] as const;

export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { rows } = await query(
      `SELECT id, name, phone, email, source, stage, value_cents, notes, created_at, updated_at
       FROM leads WHERE tenant_id=$1 ORDER BY created_at DESC`,
      [context.auth.tid],
    );
    return rows;
  });

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  source: z.string().optional().nullable(),
  stage: z.enum(stages),
  value_cents: z.number().int().min(0).default(0),
  notes: z.string().optional().nullable(),
});

export const upsertLead = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (data.id) {
      const r = await one(
        `UPDATE leads SET name=$3, phone=$4, email=$5, source=$6, stage=$7, value_cents=$8, notes=$9, updated_at=now()
         WHERE id=$1 AND tenant_id=$2 RETURNING *`,
        [data.id, context.auth.tid, data.name, data.phone, data.email, data.source, data.stage, data.value_cents, data.notes],
      );
      if (!r) throw new Error("Lead não encontrado");
      return r;
    }
    return one(
      `INSERT INTO leads(tenant_id, owner_id, name, phone, email, source, stage, value_cents, notes)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [context.auth.tid, context.auth.sub, data.name, data.phone, data.email, data.source, data.stage, data.value_cents, data.notes],
    );
  });

export const deleteLead = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await query("DELETE FROM leads WHERE id=$1 AND tenant_id=$2", [data.id, context.auth.tid]);
    return { ok: true };
  });

export const moveLead = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), stage: z.enum(stages) }).parse(d))
  .handler(async ({ data, context }) => {
    await query(
      "UPDATE leads SET stage=$3, updated_at=now() WHERE id=$1 AND tenant_id=$2",
      [data.id, context.auth.tid, data.stage],
    );
    return { ok: true };
  });
