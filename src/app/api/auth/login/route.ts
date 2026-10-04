import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Email and password are required" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Identical error for "no such user" and "wrong password" — prevents
  // attackers from probing which email addresses are registered.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const response = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,                       // JS cannot read it (XSS defense)
    sameSite: "lax",                      // CSRF protection for normal navigation
    secure: process.env.NODE_ENV === "production", // HTTPS-only in prod
    maxAge: 60 * 60 * 24 * 7,             // matches the 7d token TTL
    path: "/",
  });

  return response;
}
