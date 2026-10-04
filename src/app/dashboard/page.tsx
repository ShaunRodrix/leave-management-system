import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getBalancesForUser } from "@/lib/leave-queries";
import { AppShell } from "@/components/app-shell";
import { BalanceCards } from "@/components/balance-cards";
import { ApplyLeaveForm } from "@/components/apply-leave-form";
import { LeaveTable } from "@/components/leave-table";

/**
 * Employee dashboard — a server component: data is fetched directly via
 * Prisma (no HTTP round-trip to our own API), so first paint is one
 * database wait, not a page load + client fetch waterfall.
 */
export default async function DashboardPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const [{ balances, pending }, leaves] = await Promise.all([
    getBalancesForUser(session.userId),
    db.leaveRequest.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <AppShell name={session.email} role={session.role}>
      <div className="grid gap-8">
        <section className="grid gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Your leave balance
            </h1>
            <p className="text-sm text-zinc-500">
              Current year entitlements, updated as requests are approved
            </p>
          </div>
          <BalanceCards balances={balances} pending={pending} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <ApplyLeaveForm balances={balances} />
          <div className="grid gap-4 lg:grid-rows-[auto_1fr]">
            <h2 className="text-base font-semibold tracking-tight">
              Your applications
            </h2>
            <LeaveTable leaves={leaves} />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
