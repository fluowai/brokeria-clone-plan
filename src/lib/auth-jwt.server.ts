import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const SECRET = () => {
  const s = process.env.AUTH_JWT_SECRET;
  if (!s) throw new Error("AUTH_JWT_SECRET is not set");
  return new TextEncoder().encode(s);
};

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export type SessionClaims = {
  sub: string; // user id
  tid: string; // tenant id
  email: string;
  name: string;
  roles: string[];
};

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT(claims as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET());
}

export async function verifySession(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET());
    return payload as unknown as SessionClaims;
  } catch {
    return null;
  }
}

export const COOKIE_NAME = "sq_session";
