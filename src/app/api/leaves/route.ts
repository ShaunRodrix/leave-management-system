import { db } from "@/lib/db";
import { errorResponse, getSessionUser } from "@/lib/auth";
import { countDays, ENTITLEMENTS, rangesOverlap } from "@/lib/leave";
import { applyLeaveSchema, toUtcDate } from "@/lib/validators";

/** GET /api/leaves — the current user's leave history, newest first */
export async function GET() {
  const session = await getSessionUser();
  if (!session) return errorResponse("Authentication required", 401);

  const leaves = await db.leaveRequest.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ leaves });
}

/**
 * POST /api/leaves — apply for leave.
 *
 * Validation pipeline (all server-side):
 *   1. authenticated?
 *   2. schema valid? (type, date format, reason, end >= start)
 *   3. start date not in the past?
 *   4. no overlap with own PENDING/APPROVED leave?
 *   5. enough remaining balance for this type?
 * Only then is the request created (status PENDING, awaiting admin).
 */
export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) return errorResponse("Authentication required", 401);

  const body = await request.json().catch(() => null);
  const parsed = applyLeaveSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? "Invalid request", 400);
  }

  const { type, reason } = parsed.data;
  const start = toUtcDate(parsed.data.startDate);
  const end = toUtcDate(parsed.data.endDate);
  const days = countDays(start, end);

  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);
  if (start < todayUtc) {
    return errorResponse("Start date cannot be in the past", 400);
  }

  const activeRequests = await db.leaveRequest.findMany({
    where: { userId: session.userId, status: { in: ["PENDING", "APPROVED"] } },
    select: { type: true, days: true, status: true, startDate: true, endDate: true },
  });

  const overlaps = activeRequests.some((r) => rangesOverlap(start, end, r.startDate, r.endDate));
  if (overlaps) {
    return errorResponse("You already have pending or approved leave during these dates", 409);
  }

  const approvedUsed = activeRequests
    .filter((r) => r.type === type && r.status === "APPROVED")
    .reduce((sum, r) => sum + r.days, 0);
  if (approvedUsed + days > ENTITLEMENTS[type]) {
    return errorResponse(
      `Insufficient ${type.toLowerCase()} leave balance: ${ENTITLEMENTS[type] - approvedUsed} day(s) remaining`,
      400
    );
  }

  const leave = await db.leaveRequest.create({
    data: { userId: session.userId, type, startDate: start, endDate: end, days, reason },
  });

  return Response.json({ leave }, { status: 201 });
}
