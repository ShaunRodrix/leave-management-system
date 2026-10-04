# LeaveEase — Leave Management System

A full-stack leave management application for small teams: employees apply for
leave and track their balances, admins review requests with a live team
overview.

**Live deployment:** https://leave-management-system.vercel.app _(replace with
your final Vercel URL after the first deploy)_

## Features

**Employee**

- Secure login (JWT session cookie)
- Leave balance dashboard per type — earned / casual / sick, with usage bars,
  pending-day chips and low-balance flags
- Apply for leave with live validation: day count computes as you pick dates,
  inline warning when a range exceeds the remaining balance
- Application history with status tracking (pending / approved / rejected)

**Admin**

- Team overview band: pending approvals, who is on leave today, headcount,
  year composition (approved / pending / rejected), and a 7-day "team out"
  line chart of daily absence counts
- Leave requests queue with status tabs (live counts), urgency chips
  ("starts in 2 days"), and per-row approve / reject actions with
  server-side balance re-checking
- Employee search by **employee ID**, name or email (⌘K to focus)

## Tech Stack

| Layer      | Technology                                            |
| ---------- | ----------------------------------------------------- |
| Framework  | Next.js (App Router, React Server Components)          |
| Language   | TypeScript                                            |
| Styling    | Tailwind CSS v4 + shadcn-style UI components          |
| Font       | Plus Jakarta Sans                                     |
| Database   | PostgreSQL (hosted on Neon)                           |
| ORM        | Prisma                                                |
| Auth       | JWT session cookie (`jose`), `bcryptjs` password hashes |
| Charts     | Hand-rolled SVG (server component, zero client JS)    |
| Testing    | Vitest (domain logic)                                 |
| Hosting    | Vercel                                                |

## Architecture

- **Next.js App Router.** Pages are React Server Components: they query
  PostgreSQL directly through Prisma (no internal HTTP waterfall) and stream
  HTML. Interactive islands (`"use client"`) are limited to the leave form,
  the review table and logout.
- **Domain core in `src/lib/leave.ts`.** Entitlements, day counting and
  balance computation are pure, DB-free functions — unit-tested with Vitest
  and shared by both the API routes and the UI.
- **Data access in `src/lib/leave-queries.ts`.** One round-trip per page
  view; the admin overview derives headline counts, the year composition and
  the 7-day chart from a single query batch.
- **Auth.** `POST /api/auth/login` verifies the bcrypt hash and sets an
  HttpOnly JWT cookie (`jose`). Route-protecting middleware redirects
  unauthenticated visitors; role checks split `/admin` from `/dashboard`.
- **Approvals re-check balances server-side.** Approve/reject validates the
  balance, overlap rules and role again inside the API — the UI is never
  trusted.
- **Employee IDs.** Every user carries a stable, human-readable `employeeId`
  (1001+) assigned at creation, so admins can reference and search people
  unambiguously as the team grows.

## Getting Started (local development)

Prerequisites: Node.js 20+, PostgreSQL (or a Neon connection string).

```bash
npm install

# 1. Configure environment (see table below)
cp .env.example .env   # then fill in the values

# 2. Create the schema
npx prisma migrate deploy

# 3. Seed demo data (users + leave requests, dates relative to today)
npm run db:seed

# 4. Run
npm run dev            # http://localhost:3000
```

### Demo credentials

| Role     | Email               | Password    |
| -------- | ------------------- | ----------- |
| Admin    | admin@company.com   | `Admin@123` |
| Employee | shaun@company.com   | `Shaun@1234`|
| Employee | rahul@company.com   | `Rahul@1234`|

(Employees follow the `Name@1234` pattern: aviston, ananya, annia.)

## Environment Variables

| Variable       | Required | Description                                            |
| -------------- | -------- | ------------------------------------------------------ |
| `DATABASE_URL` | yes      | PostgreSQL connection string (Neon pooled URL in prod) |
| `JWT_SECRET`   | yes      | Random string used to sign session cookies             |

## API Reference

All routes are JSON; auth routes set/read an HttpOnly cookie.

| Method | Endpoint                | Auth    | Description                                        |
| ------ | ----------------------- | ------- | -------------------------------------------------- |
| POST   | `/api/auth/login`       | —       | Verify credentials, set session cookie             |
| POST   | `/api/auth/logout`      | session | Clear session cookie                               |
| GET    | `/api/auth/me`          | session | Current user (id, email, role)                     |
| GET    | `/api/leaves`           | session | Own leave history, newest first                    |
| POST   | `/api/leaves`           | session | Apply for leave. Validates: schema, past dates, overlap with own active leave, remaining balance |
| GET    | `/api/leaves/balance`   | session | Computed balances + pending days per type          |
| GET    | `/api/admin/leaves`     | admin   | All leave requests with employee details           |
| PATCH  | `/api/admin/leaves/:id` | admin   | Approve or reject a pending request (re-checks balance server-side) |

## Deployment

Hosted on **Vercel** with **Neon** as the managed PostgreSQL provider.

1. Import the GitHub repository into Vercel (framework auto-detected).
2. Set environment variables in the Vercel project: `DATABASE_URL`
   (Neon connection string) and `JWT_SECRET`.
3. Apply the schema and seed the database once:
   ```bash
   DATABASE_URL="<neon-url>" npx prisma migrate deploy
   DATABASE_URL="<neon-url>" npm run db:seed
   ```
4. Deploy. Every subsequent push to `main` auto-deploys through Vercel's
   GitHub integration — no manual steps.

`prisma migrate deploy` is the only migration command used in hosted
environments; schema changes land as committed SQL migrations.

## Project Structure

```
src/
  app/                  # routes: /login, /dashboard (employee), /admin, /api/*
  components/           # UI: overview band, apply form, tables, navbar, ui/ kit
  lib/
    leave.ts            # pure domain core (entitlements, balances) — unit tested
    leave-queries.ts    # shared Prisma queries for pages
    auth.ts, db.ts      # session handling, Prisma client
prisma/
  schema.prisma         # User, LeaveRequest models
  seed.ts               # idempotent demo seed, dates relative to "today"
```
