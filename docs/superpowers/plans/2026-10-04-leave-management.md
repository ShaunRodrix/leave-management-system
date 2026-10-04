# Leave Management System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A deployed leave management app — employees apply for leave and track balances; admins approve/reject and monitor team-wide leave.

**Architecture:** Single Next.js 15 codebase: React pages call internal API routes, which use Prisma to read/write Postgres on Neon. Auth is stateless JWT in an httpOnly cookie, verified in Edge middleware and re-checked per admin route. Balances are computed from approved requests, never stored.

**Tech Stack:** Next.js 15 (App Router, TS), Tailwind + shadcn/ui, Prisma + PostgreSQL (Neon), jose (JWT), bcryptjs, zod, Vitest, Vercel.

**Spec:** `docs/superpowers/specs/2026-10-04-leave-management-design.md`

## Global Constraints

- Node 26, TypeScript strict mode
- All business validation server-side (dates, overlap, balance) — never trust the client
- Balances computed, never stored; entitlements: CASUAL 12 / SICK 10 / EARNED 6 per calendar year
- Statuses: PENDING → APPROVED | REJECTED (immutable once reviewed)
- Roles: EMPLOYEE | ADMIN; admin routes re-check role server-side
- All project docs written as a real product (no mention of interviews/take-homes)
- Frequent commits; deploy to Vercel before UI polish is complete (deployment risk first)

---

### Task 1: Scaffold

**Files:** Create project via `create-next-app` in repo root; `components.json` (shadcn), deps.

- [ ] `npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack`
- [ ] `npm i @prisma/client bcryptjs jose zod` · `npm i -D prisma vitest tsx`
- [ ] `npx shadcn@latest init` (neutral base) + `npx shadcn@latest add button card input label select table badge dialog textarea tabs`
- [ ] `git init`, first commit

### Task 2: Database (Prisma + Neon)

**Files:** `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/db.ts`, `.env`, `.env.example`

**Produces:** `db` (PrismaClient singleton from `@/lib/db`); models `User`, `LeaveRequest`; enums `Role`, `LeaveType`, `LeaveStatus`.

- [ ] schema per spec (enums inline, `reviewedById` FK nullable, `days` stored on request)
- [ ] `src/lib/db.ts` — global-singleton PrismaClient (avoids dev hot-reload connection exhaustion)
- [ ] Create Neon project → copy `DATABASE_URL` into `.env`; `.env.example` with placeholder + `JWT_SECRET`
- [ ] `npx prisma migrate dev --name init`
- [ ] `prisma/seed.ts`: hash `Password@123` with bcryptjs once; upsert admin `admin@company.com` (Admin@123) + employees `alex|priya|sam|nina@company.com` (Employee@123); insert ~15 requests across statuses/types/dates (past + future, PENDING/APPROVED/REJECTED)
- [ ] `"prisma": { "seed": "tsx prisma/seed.ts" }` in package.json → `npx prisma db seed` → commit

### Task 3: Leave domain logic (TDD)

**Files:** Create `src/lib/leave.ts`, Test `src/lib/__tests__/leave.test.ts`, `vitest.config.ts`

**Produces (exact signatures):**
```ts
export const ENTITLEMENTS: Record<LeaveType, number>
export function countDays(start: Date, end: Date): number          // inclusive
export function rangesOverlap(aS: Date, aE: Date, bS: Date, bE: Date): boolean
export function computeBalances(approved: { type: LeaveType; days: number }[]): Record<LeaveType, { entitlement: number; used: number; remaining: number }>
```

- [ ] **Write failing tests** (pure functions, no DB): countDays same-day = 1; cross-month range = correct inclusive count; overlap touching edges = true; disjoint = false; computeBalances mixes types, used sums approved only, remaining = entitlement − used (can go negative only if data corrupted — clamp not applied; UI shows 0 via Math.max)
- [ ] Run → FAIL · implement → PASS · commit

### Task 4: Auth

**Files:** Create `src/lib/auth.ts`, `src/app/api/auth/login/route.ts`, `.../logout/route.ts`, `.../me/route.ts`, `src/middleware.ts`

**Produces:**
```ts
type SessionPayload = { userId: number; email: string; role: "EMPLOYEE" | "ADMIN" }
createSession(payload): Promise<string>          // jose SignJWT, HS256, 7d
verifySession(token): Promise<SessionPayload | null>
SESSION_COOKIE = "session"
getSessionUser(): Promise<SessionPayload | null>  // reads cookies() in route handlers
```

- [ ] login route: zod email/password → find user → `bcryptjs.compare` → set httpOnly/sameSite=lax/secure cookie → 200 `{ user }`; invalid → 401 `{ error }`
- [ ] logout clears cookie; `me` returns session user or 401
- [ ] middleware: no token → redirect `/login`; valid token hitting `/login` → redirect role home (`/admin` | `/dashboard`); `/admin/**` requires `role === "ADMIN"` else redirect `/dashboard`
- [ ] Manual check: curl login → cookie set; protected page redirects without cookie → commit

### Task 5: Employee API (apply / history / balance)

**Files:** Create `src/app/api/leaves/route.ts` (GET, POST), `src/app/api/leaves/balance/route.ts`, `src/lib/validators.ts`

**Produces:** POST `/api/leaves` body `{ type, startDate, endDate, reason }` → 201 `{ leave }` or 400 `{ error }`; GET → own requests desc; balance route → `computeBalances` + pending counts.

- [ ] validators.ts: zod schema — type enum, dates ISO (end ≥ start), reason min 3 chars; parse to Date at UTC midnight
- [ ] POST pipeline: session → validate → past-date check → overlap vs own PENDING+APPROVED (fetch, then `rangesOverlap`) → balance check (approved-used + this request ≤ entitlement) → insert `days: countDays(...)` → 201
- [ ] Every failure returns a human-readable `{ error }` (these messages surface in the UI toast) → commit

### Task 6: Admin API (list all / approve / reject)

**Files:** Create `src/app/api/admin/leaves/route.ts` (GET), `src/app/api/admin/leaves/[id]/route.ts` (PATCH), `src/lib/leave-queries.ts`

**Produces:** GET all with `include: { user: { select: { id, name, email } } }`, newest first; PATCH body `{ action: "APPROVED" | "REJECTED" }` → updates status + reviewedBy/At.

- [ ] Role guard helper `requireAdmin()` in `src/lib/auth.ts` → 403 when not admin (route-level check, middleware is belt-and-suspenders)
- [ ] PATCH approve edge case: re-check overlap/balance at approval time (another request may have consumed balance since) → 409 on conflict
- [ ] REJECTED is always allowed → commit

### Task 7: Login page + shell

**Files:** `src/app/page.tsx` (redirect by session), `src/app/login/page.tsx`, `src/app/layout.tsx` (metadata "LeaveEase"), shared `src/components/app-shell.tsx` (topbar: logo, user name/role, logout)

- [ ] Login: centered card, email/password, error alert on 401, submit → POST login → `router.replace(role === "ADMIN" ? "/admin" : "/dashboard")`
- [ ] Demo-credentials hint block on the login card (evaluator convenience) → commit

### Task 8: Employee dashboard

**Files:** `src/app/dashboard/page.tsx`, components `balance-cards.tsx`, `apply-leave-form.tsx`, `leave-table.tsx`

- [ ] Layout: 3 balance cards (type, remaining big / entitlement small, subtle progress) → apply form card (type select, date pickers, reason textarea; client zod check + server error toast) → history table (type badge, dates, days, status badge chip colored: amber PENDING / green APPROVED / red REJECTED, applied-on)
- [ ] Server components fetch via Prisma directly (`getSessionUser` + queries) — no client fetch waterfall; form is the one client component, calls POST, `router.refresh()` on success → commit

### Task 9: Admin dashboard

**Files:** `src/app/admin/page.tsx`, components `stat-cards.tsx`, `admin-leave-table.tsx`

- [ ] Stats: pending count, on-leave today (approved range covering today), total employees
- [ ] Table: employee, type, dates, days, reason (truncated, dialog for full), status, applied-on; PENDING rows show Approve/Reject buttons → PATCH → `router.refresh()`; optimistic disable while in-flight
- [ ] Filter tabs: All / Pending / Approved / Rejected → commit

### Task 10: Deploy (before polish!)

- [ ] Push to GitHub (repo: leave-management-system)
- [ ] Neon → Vercel integration or paste `DATABASE_URL`; set `JWT_SECRET` (32+ random chars)
- [ ] `npx prisma migrate deploy` against production URL + seed
- [ ] Verify live: login both roles → apply → approve → balances drop
- [ ] Vercel custom domain `leave.seanrodrigues.dev` only if time remains

### Task 11: README + final review

**Files:** `README.md`, `.env.example`, remove dev cruft

- [ ] README per spec: overview, features, architecture (UI → API routes → Prisma → Neon diagram), tech stack + why, setup (clone→install→env→migrate→seed→dev), env table, API table (method/path/auth/body/response), deployment section (Vercel + Neon, update steps), demo credentials
- [ ] Code-review pass (superpowers:requesting-code-review), fix findings, final commit, submit links

## Self-Review

- Spec coverage: all 6 brief features map to Tasks 4-9; deployment Task 10; README Task 11; seed Task 2; tests Task 3. ✓
- No placeholders: business logic signatures and flows fully specified; UI tasks specify components/data/actions precisely. ✓
- Type consistency: `SessionPayload`, `computeBalances` return shape, `PATCH { action }` used consistently across tasks. ✓
