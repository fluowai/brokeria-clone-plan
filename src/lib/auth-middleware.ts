import { createMiddleware } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { verifySession, COOKIE_NAME, type SessionClaims } from "./auth-jwt.server";

export const requireAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const token = getCookie(COOKIE_NAME);
  if (!token) throw new Error("Unauthorized");
  const claims = await verifySession(token);
  if (!claims) throw new Error("Unauthorized");
  return next({ context: { auth: claims as SessionClaims } });
});

export const requireSuperAdmin = createMiddleware({ type: "function" })
  .middleware([requireAuth])
  .server(async ({ next, context }) => {
    if (!context.auth.roles.includes("super_admin")) throw new Error("Forbidden");
    return next({ context });
  });
