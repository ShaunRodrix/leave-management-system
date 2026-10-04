# Leave Management System — Design

**Context:** Internal leave management for a growing company — employees apply and track balances; admins review and monitor team-wide leave. Deployed on Vercel with production-grade documentation.

## Purpose

Internal tool for a company: employees apply for leave and track balances; an admin reviews, approves/rejects, and sees team-wide stats.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router, TypeScript) | One codebase for UI + API; zero-config Vercel deploy |
| UI | Tailwind CSS + shadcn/ui | Polished dashboard fast; components are owned code |
| Database | PostgreSQL (Neon, free tier) | Serverless Postgres; Vercel-native integration |
| ORM | Prisma | Typed client; schema file doubles as documentation |
| Auth | Email/password, JWT in httpOnly cookie (`jose`) | ~50 lines, fully explainable; `jose` works on Edge middleware |
| Password hashing | bcryptjs | Pure JS, no native build issues on Vercel |
| Hosting | Vercel | Explicitly requested in the brief |

## Data Model (2 tables)

```
User
  id          Int      @id @default(autoincrement())
  name        String
  email       String   @unique
  passwordHash String
  role        Role     @default(EMPLOYEE)   // EMPLOYEE | ADMIN
  leaves      LeaveRequest[]

LeaveRequest
  id          Int          @id @default(autoincrement())
  userId      Int
  user        User         @relation(...)
  type        LeaveType    // CASUAL | SICK | EARNED
  startDate   DateTime
  endDate     DateTime
  days        Int          // business days count, computed at apply time
  reason      String
  status      LeaveStatus  @default(PENDING)  // PENDING | APPROVED | REJECTED
  reviewedById Int?
  reviewedBy  User?        @relation(...)
  reviewedAt  DateTime?
  createdAt   DateTime     @default(now())
```

**Balances are computed, never stored.** Balance = entitlement − sum of APPROVED days per type for the current year. Stored counters drift when leaves are rejected/cancelled; computed values cannot.

## Business Rules

- Entitlements per year: CASUAL 12, SICK 10, EARNED 6
- Apply validation (server-side, all of it):
  - `endDate >= startDate`
  - `startDate` not in the past
  - No date overlap with the user's PENDING or APPROVED requests
  - Requested days ≤ remaining balance for that type
- Approve/reject: admin only; sets status, reviewedBy, reviewedAt. Approval of a request that no longer fits the balance (edge: overlapping applications) is rejected with a clear error.
- Role checks: middleware protects `/dashboard` and `/admin`; admin routes re-check role server-side (never trust the client).

## Pages (3)

1. `/login` — email/password form; sets JWT cookie; redirects by role
2. `/dashboard` (employee) — balance cards per leave type, apply form, own requests table with status chips
3. `/admin` (admin only) — stat cards (pending approvals, on leave today, total employees), all requests table with approve/reject actions

## API Routes (7)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | public | Validate credentials, set JWT cookie |
| POST | `/api/auth/logout` | any | Clear cookie |
| GET | `/api/auth/me` | any | Current user from cookie |
| GET | `/api/leaves/balance` | employee | Computed balances per type |
| GET | `/api/leaves` | employee | Own leave history |
| POST | `/api/leaves` | employee | Apply (runs all validation) |
| GET | `/api/admin/leaves` | admin | All requests |
| PATCH | `/api/admin/leaves/[id]` | admin | Approve/reject |

## Seed Data

1 admin + 4 employees; ~15 leave requests across statuses so dashboards look real. Demo credentials documented in README.

## Testing

Targeted tests for business logic only (Vitest):
- Balance computation (approved days deducted, pending not)
- Overlap detection
- Days calculation across date ranges

UI and API routes verified manually via the deployed app — time-boxed take-home.

## Deployment

Vercel (framework-detected, zero config) + Neon Postgres via Vercel integration. Env vars: `DATABASE_URL`, `JWT_SECRET`. `prisma generate` runs in build; migrations applied against Neon before first deploy. Custom domain (subdomain of seanrodrigues.dev) only if time remains.

## README (per brief)

Overview, features, architecture, tech stack, setup instructions, env variables table, API details, live URL, Deployment section (where/approach/services/update steps), demo credentials.

## Out of Scope (deliberate)

Manager role / multi-level approvals (not in brief) · Google OAuth (bonus only if everything lands early) · email notifications · cancel/edit of pending requests · year carry-forward.
