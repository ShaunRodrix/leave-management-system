import type { LeaveBalance, LeaveType } from "@/lib/leave";

const TYPE_LABELS: Record<LeaveType, string> = {
  CASUAL: "Casual",
  SICK: "Sick",
  EARNED: "Earned",
};

export function BalanceCards({
  balances,
  pending,
}: {
  balances: Record<LeaveType, LeaveBalance>;
  pending: Record<LeaveType, number>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {(Object.keys(balances) as LeaveType[]).map((type) => {
        const b = balances[type];
        const pendingDays = pending[type];
        const pct = Math.min(100, Math.round((b.used / b.entitlement) * 100));
        return (
          <div
            key={type}
            className="rounded-xl border border-zinc-200 bg-white p-5"
          >
            <p className="text-sm font-medium text-zinc-500">
              {TYPE_LABELS[type]} leave
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              {Math.max(0, b.remaining)}
              <span className="ml-1.5 text-sm font-normal text-zinc-400">
                / {b.entitlement} days
              </span>
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-zinc-900"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {b.used} day{b.used === 1 ? "" : "s"} used
              {pendingDays > 0 && (
                <span className="text-amber-600"> · {pendingDays} pending</span>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}
