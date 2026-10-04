/**
 * Shared data access for admin views. Kept out of route files so the
 * server components (Task 9) reuse the exact same queries as the API.
 */
import { db } from "@/lib/db";
import { computeBalances, type LeaveBalance, type LeaveType } from "@/lib/leave";

export type LeaveWithUser = Awaited<ReturnType<typeof getAllLeaves>>[number];

/**
 * Computed balances + pending-day counts for one user in the current
 * calendar year. Single source of truth — used by both the balance API
 * route and the dashboard server component.
 */
export async function getBalancesForUser(userId: number): Promise<{
  balances: Record<LeaveType, LeaveBalance>;
  pending: Record<LeaveType, number>;
}> {
  const yearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));

  const leaves = await db.leaveRequest.findMany({
    where: { userId, startDate: { gte: yearStart }, status: { in: ["APPROVED", "PENDING"] } },
    select: { type: true, days: true, status: true },
  });

  const balances = computeBalances(
    leaves.filter((l) => l.status === "APPROVED").map(({ type, days }) => ({ type, days }))
  );

  const pending: Record<LeaveType, number> = { CASUAL: 0, SICK: 0, EARNED: 0 };
  for (const l of leaves) {
    if (l.status === "PENDING") pending[l.type] += l.days;
  }

  return { balances, pending };
}

export async function getAllLeaves() {
  return db.leaveRequest.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type OverviewDay = {
  date: Date;
  isWeekend: boolean;
  approved: number;
  pending: number;
};

export type Overview = {
  pendingCount: number;
  onLeaveToday: number;
  totalEmployees: number;
  /** Requests starting this calendar year, by status, plus approved day total */
  year: { approved: number; pending: number; rejected: number; daysGranted: number };
  /** Rolling window: today + 6 days, how many people are off each day.
      Counts only — never names — so it scales to any headcount. */
  week: OverviewDay[];
};

/**
 * Everything the admin overview band shows, in one round-trip: headline
 * counts, this-year composition, and the 7-day out chart (counts only,
 * no personal data, so it holds at any headcount).
 */
export async function getOverview(): Promise<Overview> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const lastDay = new Date(today);
  lastDay.setUTCDate(lastDay.getUTCDate() + 6);
  const yearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));

  const [weekLeaves, yearLeaves, employees, pendingCount, onLeaveToday] =
    await Promise.all([
      db.leaveRequest.findMany({
        where: {
          status: { in: ["APPROVED", "PENDING"] },
          startDate: { lte: lastDay },
          endDate: { gte: today },
        },
        select: { startDate: true, endDate: true, status: true },
      }),
      db.leaveRequest.findMany({
        where: { startDate: { gte: yearStart } },
        select: { status: true, days: true },
      }),
      db.user.count({ where: { role: "EMPLOYEE" } }),
      db.leaveRequest.count({ where: { status: "PENDING" } }),
      db.leaveRequest.count({
        where: {
          status: "APPROVED",
          startDate: { lte: today },
          endDate: { gte: today },
        },
      }),
    ]);

  const week: OverviewDay[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() + i);
    const day = date.getTime();
    let approved = 0;
    let pending = 0;
    for (const l of weekLeaves) {
      if (l.startDate.getTime() <= day && day <= l.endDate.getTime()) {
        if (l.status === "APPROVED") approved += 1;
        else pending += 1;
      }
    }
    week.push({ date, isWeekend: date.getUTCDay() === 0 || date.getUTCDay() === 6, approved, pending });
  }

  const year = { approved: 0, pending: 0, rejected: 0, daysGranted: 0 };
  for (const row of yearLeaves) {
    if (row.status === "APPROVED") {
      year.approved += 1;
      year.daysGranted += row.days;
    } else if (row.status === "PENDING") {
      year.pending += 1;
    } else {
      year.rejected += 1;
    }
  }

  return {
    pendingCount,
    onLeaveToday,
    totalEmployees: employees,
    year,
    week,
  };
}
