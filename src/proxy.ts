/**
 * Proxy (Next.js 16 — formerly "middleware"): runs before pages render.
 *
 * Responsibilities:
 *  - /dashboard/**, /admin/**  → require a valid session cookie
 *  - /admin/**                 → additionally require role ADMIN
 *  - /login                    → logged-in users bounce to their home page
 *
 * This is a convenience layer (fast redirects, no page flicker). Every
 * server component and API route STILL re-verifies the session — security
 * decisions are never made on the proxy alone.
 */
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/login";
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (!session && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && isLoginPage) {
    const home = session.role === "ADMIN" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (session && pathname.startsWith("/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login"],
};
