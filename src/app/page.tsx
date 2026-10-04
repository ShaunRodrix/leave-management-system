import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

/** Entry point: send each visitor to their role's home page */
export default async function Home() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  redirect(session.role === "ADMIN" ? "/admin" : "/dashboard");
}
