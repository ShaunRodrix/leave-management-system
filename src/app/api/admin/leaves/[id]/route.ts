import { db } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth";
import { ENTITLEMENTS } from "@/lib/leave";

/**
 * PATCH /api/admin/leaves/[id] — approve or reject a pending request.
 * Body: { "action": "APPROVED" | "REJECTED" }
 *
 * Reviewing is final: an already-reviewed request cannot change status.
 * APPROVED re-validates balance and overlap AT APPROVAL TIME — other
 * approvals may have consumed the balance since the request was filed.
 * Overlap is checked against APPROVED leave only; PENDING requests are
 * re-validated at their own review time.
 */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const { id } = await ctx.params;
  const leaveId = Number(id);
  if (!Number.isInteger(leaveId)) return errorResponse("Invalid leave id", 400);

  const body = await request.json().catch(() => null);
  const action = (body as { action?: unknown } | null)?.action;
  if (action !== "APPROVED" && action !== "REJECTED") {
    return errorResponse('Body must be { "action": "APPROVED" | "REJECTED" }', 400);
  }

  const leave = await db.leaveRequest.findUnique({ where: { id: leaveId } });
  if (!leave) return errorResponse("Leave request not found", 404);
  if (leave.status !== "PENDING") {
    return errorResponse(`This request was already ${leave.status.toLowerCase()}`, 409);
  }

  if (action === "APPROVED") {
    const yearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));

    const approvedSameType = await db.leaveRequest.findMany({
      where: {
        userId: leave.userId,
        type: leave.type,
        status: "APPROVED",
        id: { not: leave.id },
        startDate: { gte: yearStart },
      },
      select: { days: true, startDate: true, endDate: true },
    });

    const used = approvedSameType.reduce((sum, r) => sum + r.days, 0);
    if (used + leave.days > ENTITLEMENTS[leave.type]) {
      return errorResponse(
        `Cannot approve: employee has only ${ENTITLEMENTS[leave.type] - used} ${leave.type.toLowerCase()} day(s) left`,
        409
      );
    }

    const overlappingApproved = await db.leaveRequest.findFirst({
      where: {
        userId: leave.userId,
        status: "APPROVED",
        id: { not: leave.id },
        startDate: { lte: leave.endDate },
        endDate: { gte: leave.startDate },
      },
      select: { id: true },
    });
    if (overlappingApproved) {
      return errorResponse("Cannot approve: overlaps with already approved leave", 409);
    }
  }

  const updated = await db.leaveRequest.update({
    where: { id: leaveId },
    data: {
      status: action,
      reviewedById: admin.userId,
      reviewedAt: new Date(),
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return Response.json({ leave: updated });
}
