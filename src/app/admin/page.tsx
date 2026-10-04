import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getAllLeaves, getOverview } from "@/lib/leave-queries";
import { AppShell } from "@/components/app-shell";
import { OverviewBand } from "@/components/overview-band";
import { AdminLeaveTable } from "@/components/admin-leave-table";

export default async function AdminPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const [overview, leaves] = await Promise.all([getOverview(), getAllLeaves()]);

  return (
    <AppShell name={session.email} role={session.role}>
      <div className="grid gap-8">
        <section className="grid gap-4">
          <div className="pop d0">
            <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
            <p className="text-sm text-zinc-500">Team leave at a glance</p>
          </div>
          <div className="pop d1">
            <OverviewBand data={overview} />
          </div>
        </section>

        <section className="grid gap-4">
          <div className="pop d2">
            <h2 className="text-base font-semibold tracking-tight">
              Leave requests
            </h2>
            <p className="text-sm text-zinc-500">
              Review pending applications — approving re-checks balances
            </p>
          </div>
          <div className="pop d3">
            <AdminLeaveTable leaves={leaves} />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
