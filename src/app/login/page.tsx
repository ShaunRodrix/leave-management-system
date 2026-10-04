"use client";

/**
 * Login page. On success the server sets an httpOnly JWT cookie and the
 * user is routed to their role's home page. A full assignment (not client
 * router navigation) guarantees the proxy sees the new cookie.
 */
import { useEffect, useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // After logout, the browser's back button can restore the previous page
  // from the back-forward cache without a server round-trip — making the
  // logged-out dashboard appear alive. Force a real navigation so the
  // proxy re-checks the (cleared) session and bounces the user to login.
  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) window.location.reload();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      window.location.assign(data.user.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <CalendarDays className="size-5" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight">LeaveEase</h1>
          <p className="text-sm text-zinc-500">Sign in to manage your leave</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sign in</CardTitle>
            <CardDescription>Use your work email and password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-4 rounded-md border border-dashed border-zinc-300 bg-white px-4 py-3 text-xs text-zinc-500">
          <p className="mb-1.5 font-medium text-zinc-600">Demo accounts</p>
          <div className="grid gap-1">
            <button
              type="button"
              onClick={() => fillDemo("admin@company.com", "Admin@123")}
              className="text-left hover:text-zinc-900"
            >
              Admin — admin@company.com / Admin@123
            </button>
            <button
              type="button"
              onClick={() => fillDemo("shaun@company.com", "Shaun@1234")}
              className="text-left hover:text-zinc-900"
            >
              Employee — shaun@company.com / Shaun@1234
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
