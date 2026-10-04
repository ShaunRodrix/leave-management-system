/**
 * Shared data access for admin views. Kept out of route files so the
 * server components (Task 9) reuse the exact same queries as the API.
 */
import { db } from "@/lib/db";

export type LeaveWithUser = Awaited<ReturnType<typeof getAllLeaves>>[number];

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
