import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
  return Response.json({ user: session });
}
