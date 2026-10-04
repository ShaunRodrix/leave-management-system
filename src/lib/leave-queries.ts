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

export async function getTeamStats() {
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);

  const [pendingCount, onLeaveToday, totalEmployees] = await Promise.all([
    db.leaveRequest.count({ where: { status: "PENDING" } }),
    db.leaveRequest.count({
      where: {
        status: "APPROVED",
        startDate: { lte: todayUtc },
        endDate: { gte: todayUtc },
      },
    }),
    db.user.count({ where: { role: "EMPLOYEE" } }),
  ]);

  return { pendingCount, onLeaveToday, totalEmployees };
}
