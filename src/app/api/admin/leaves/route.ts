import { errorResponse, requireAdmin } from "@/lib/auth";
import { getAllLeaves } from "@/lib/leave-queries";

/** GET /api/admin/leaves — every request with employee details, newest first */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const leaves = await getAllLeaves();
  return Response.json({ leaves });
}
