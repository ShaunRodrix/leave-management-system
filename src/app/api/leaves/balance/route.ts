import { errorResponse, getSessionUser } from "@/lib/auth";
import { computeBalances, type LeaveType } from "@/lib/leave";
import { db } from "@/lib/db";

/**
 * GET /api/leaves/balance — computed balances for the current year.
 * `balances` derives from APPROVED days; `pending` lists days awaiting review.
 */
export async function GET() {
  const session = await getSessionUser();
  if (!session) return errorResponse("Authentication required", 401);

  const yearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));

  const leaves = await db.leaveRequest.findMany({
    where: { userId: session.userId, startDate: { gte: yearStart }, status: { in: ["APPROVED", "PENDING"] } },
    select: { type: true, days: true, status: true },
  });

  const balances = computeBalances(
    leaves.filter((l) => l.status === "APPROVED").map(({ type, days }) => ({ type: type as LeaveType, days }))
  );

  const pending: Record<LeaveType, number> = { CASUAL: 0, SICK: 0, EARNED: 0 };
  for (const l of leaves) {
    if (l.status === "PENDING") pending[l.type as LeaveType] += l.days;
  }

  return Response.json({ balances, pending });
}
