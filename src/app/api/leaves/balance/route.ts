import { errorResponse, getSessionUser } from "@/lib/auth";
import { getBalancesForUser } from "@/lib/leave-queries";

/** GET /api/leaves/balance — computed balances + pending days, current year */
export async function GET() {
  const session = await getSessionUser();
  if (!session) return errorResponse("Authentication required", 401);

  const { balances, pending } = await getBalancesForUser(session.userId);
  return Response.json({ balances, pending });
}
