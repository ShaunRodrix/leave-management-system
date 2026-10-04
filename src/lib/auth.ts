/**
 * Auth core: JWT creation/verification + session helpers.
 *
 * Flow: login route verifies credentials → signs a JWT (jose, HS256) →
 * sets it as an httpOnly cookie. httpOnly means JavaScript cannot read
 * the token, which neutralizes token theft via XSS.
 *
 * `jose` is used because it runs on any runtime (Edge/Node); `jsonwebtoken`
 * is Node-only.
 */
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type Role = "EMPLOYEE" | "ADMIN";

export type SessionPayload = {
  userId: number;
  email: string;
  role: Role;
};

export const SESSION_COOKIE = "session";
const TOKEN_TTL = "7d";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET is not configured (must be 16+ chars)");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.userId !== "number" ||
      (payload.role !== "EMPLOYEE" && payload.role !== "ADMIN") ||
      typeof payload.email !== "string"
    ) {
      return null;
    }
    return { userId: payload.userId, email: payload.email, role: payload.role };
  } catch {
    // Invalid signature, expired token, malformed input — all mean "no session"
    return null;
  }
}

/**
 * Reads the session from the incoming request's cookie.
 * Works in server components and route handlers.
 */
export async function getSessionUser(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Helper for route handlers: a JSON error Response */
export function errorResponse(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

/**
 * Route-handler guard for admin endpoints. Proxy checks roles too, but
 * never trust the edge alone — each admin route re-verifies here.
 * Usage:
 *   const admin = await requireAdmin();
 *   if (admin instanceof Response) return admin;
 */
export async function requireAdmin(): Promise<SessionPayload | Response> {
  const session = await getSessionUser();
  if (!session) return errorResponse("Authentication required", 401);
  if (session.role !== "ADMIN") return errorResponse("Admin access required", 403);
  return session;
}
