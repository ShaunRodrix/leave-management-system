"use client";

/**
 * Login page. Split layout on desktop: dark brand panel (Escape Flight
 * illustration) + the sign-in card. On mobile the brand collapses into a
 * slim top bar and the card sits below it — no vertical-center float, so
 * nothing overflows or drifts mid-page. "Welcome back" is centered on
 * every screen; fields stay left-aligned for usability.
 *
 * On success the server sets an httpOnly JWT cookie and the user is
 * routed to their role's home page. A full assignment (not client
 * router navigation) guarantees the proxy sees the new cookie.
 */
import { useState } from "react";
import { CalendarDays, CircleCheck, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EscapeFlightArt } from "@/components/escape-flight-art";

function BrandMark() {
  return (
    <span className="flex size-9 items-center justify-center rounded-[11px] bg-zinc-50 text-zinc-900">
      <CalendarDays className="size-5" />
    </span>
  );
}

function InkMark() {
  return (
    <span className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 text-[12px] font-bold text-white">
      L
    </span>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="login-dots min-h-screen overflow-x-clip">
      {/* ---- mobile brand bar ---- */}
      <div className="flex items-center gap-2.5 border-b border-zinc-200 bg-white px-5 py-3.5 lg:hidden">
        <InkMark />
        <span className="text-[15px] font-bold tracking-tight text-zinc-900">LeaveEase</span>
      </div>

      <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-[1.05fr_1fr]">
        {/* ---- brand panel (desktop) ---- */}
        <aside className="login-panel relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-10">
          <div className="login-glow pointer-events-none absolute inset-0" aria-hidden />

          <div className="rise relative z-10 flex items-center gap-3" style={{ "--rd": ".05s" } as React.CSSProperties}>
            <BrandMark />
            <span className="text-[17px] font-bold tracking-tight text-white">LeaveEase</span>
          </div>

          <div className="rise relative z-10 mt-10 max-w-[380px]" style={{ "--rd": ".15s" } as React.CSSProperties}>
            <p className="text-[clamp(26px,2.4vw,34px)] font-bold leading-[1.14] tracking-[-0.03em] text-white">
              Time off,
              <br />
              perfectly in place.
            </p>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-zinc-400">
              Requests, approvals and balances in one calm place.
            </p>
          </div>

          <div className="rise relative z-10 grid flex-1 place-items-center py-6" style={{ "--rd": ".3s" } as React.CSSProperties}>
            <EscapeFlightArt />
          </div>

          <div className="rise relative z-10 flex flex-wrap gap-x-6 gap-y-2.5" style={{ "--rd": ".4s" } as React.CSSProperties}>
            {["Request in seconds", "Approvals that flow", "Balances, always accurate"].map((label) => (
              <span key={label} className="flex items-center gap-2 text-[13px] text-zinc-400">
                <CircleCheck className="size-[15px] text-emerald-400" />
                {label}
              </span>
            ))}
          </div>
        </aside>

        {/* ---- sign-in card ---- */}
        <main className="w-full flex items-center justify-center px-4 py-10 sm:px-6 lg:py-12">
          <div className="w-full max-w-[343px] rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_20px_46px_-26px_rgba(24,24,27,0.3)] sm:max-w-sm sm:p-7">
            <h1 className="rise text-center text-[26px] font-bold tracking-tight" style={{ "--rd": ".1s" } as React.CSSProperties}>
              Welcome back
            </h1>
            <p className="rise mt-1.5 text-center text-sm text-zinc-500" style={{ "--rd": ".18s" } as React.CSSProperties}>
              Sign in to manage your leave
            </p>

            <form onSubmit={handleSubmit} className="rise mt-6 grid gap-4" style={{ "--rd": ".26s" } as React.CSSProperties}>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="h-11 rounded-[10px] bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="h-11 rounded-[10px] bg-white pr-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-1.5 bottom-1.5 flex size-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}

              <Button type="submit" disabled={loading} className="h-11 rounded-[10px] text-[15px]">
                {loading && <Loader2 className="size-4 animate-spin" />}
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="rise mt-5 rounded-xl border border-dashed border-zinc-300 bg-white/70 px-4 py-3.5" style={{ "--rd": ".34s" } as React.CSSProperties}>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-zinc-400">
                Demo accounts
              </p>
              <div className="grid gap-1">
                <button
                  type="button"
                  onClick={() => fillDemo("admin@company.com", "Admin@123")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    Admin
                  </span>
                  admin@company.com
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("shaun@company.com", "Shaun@1234")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                    Employee
                  </span>
                  shaun@company.com
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
