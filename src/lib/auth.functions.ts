import { createServerFn } from "@tanstack/react-start";
import { setCookie, deleteCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { query, one } from "./db.server";
import { hashPassword, verifyPassword, signSession, COOKIE_NAME } from "./auth-jwt.server";
import { requireAuth } from "./auth-middleware";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  agency: z.string().min(2),
  vertical: z.enum(["urban", "rural", "developer", "land"]).default("urban"),
});

async function issueSession(user: { id: string; tenant_id: string; email: string; name: string }) {
  const roles = await query<{ role: string }>("SELECT role FROM user_roles WHERE user_id=$1", [user.id]);
  const token = await signSession({
    sub: user.id,
    tid: user.tenant_id,
    email: user.email,
    name: user.name,
    roles: roles.rows.map((r) => r.role),
  });
  setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return roles.rows.map((r) => r.role);
}

export const signUp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => signUpSchema.parse(d))
  .handler(async ({ data }) => {
    const emailLower = data.email.toLowerCase();
    const existing = await one("SELECT id FROM users WHERE email=$1", [emailLower]);
    if (existing) throw new Error("Email já cadastrado");

    let slug = slugify(data.agency);
    let n = 0;
    while (await one("SELECT id FROM tenants WHERE slug=$1", [slug])) {
      n += 1;
      slug = `${slugify(data.agency)}-${n}`;
    }

    const tenant = await one<{ id: string }>(
      "INSERT INTO tenants(name, slug, vertical, verticals) VALUES($1,$2,$3,ARRAY[$3]::tenant_vertical[]) RETURNING id",
      [data.agency, slug, data.vertical],
    );
    if (!tenant) throw new Error("Falha ao criar tenant");

    const hash = await hashPassword(data.password);
    const user = await one<{ id: string; tenant_id: string; email: string; name: string }>(
      `INSERT INTO users(tenant_id,email,password_hash,name)
       VALUES($1,$2,$3,$4) RETURNING id, tenant_id, email, name`,
      [tenant.id, emailLower, hash, data.name],
    );
    if (!user) throw new Error("Falha ao criar usuário");

    // Trial 7 dias + créditos iniciais
    await query(
      `INSERT INTO subscriptions(tenant_id, status, trial_ends_at)
       VALUES($1,'trial', now() + interval '7 days')
       ON CONFLICT (tenant_id) DO NOTHING`,
      [tenant.id],
    );
    await query(
      "INSERT INTO credit_ledger(tenant_id, delta, reason) VALUES($1,$2,$3)",
      [tenant.id, 100, "trial:signup"],
    );

    const roles = await issueSession(user);
    return { user: { id: user.id, email: user.email, name: user.name, tenantId: user.tenant_id, roles } };
  });

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const signIn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => signInSchema.parse(d))
  .handler(async ({ data }) => {
    const user = await one<{ id: string; tenant_id: string; email: string; name: string; password_hash: string }>(
      "SELECT id, tenant_id, email, name, password_hash FROM users WHERE email=$1 AND is_active=true",
      [data.email.toLowerCase()],
    );
    if (!user) throw new Error("Credenciais inválidas");
    const ok = await verifyPassword(data.password, user.password_hash);
    if (!ok) throw new Error("Credenciais inválidas");
    const roles = await issueSession(user);
    return { user: { id: user.id, email: user.email, name: user.name, tenantId: user.tenant_id, roles } };
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie(COOKIE_NAME, { path: "/" });
  return { ok: true };
});

export const me = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const tenant = await one<{ vertical: string; verticals: string[]; name: string; slug: string }>(
      "SELECT vertical, verticals, name, slug FROM tenants WHERE id=$1",
      [context.auth.tid],
    );
    return {
      user: {
        id: context.auth.sub,
        email: context.auth.email,
        name: context.auth.name,
        tenantId: context.auth.tid,
        roles: context.auth.roles,
        tenant: tenant ?? null,
      },
    };
  });
