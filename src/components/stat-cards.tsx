export function StatCards({
  pendingCount,
  onLeaveToday,
  totalEmployees,
}: {
  pendingCount: number;
  onLeaveToday: number;
  totalEmployees: number;
}) {
  const stats = [
    { label: "Pending approvals", value: pendingCount, accent: pendingCount > 0 },
    { label: "On leave today", value: onLeaveToday, accent: false },
    { label: "Employees", value: totalEmployees, accent: false },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-zinc-200 bg-white p-5"
        >
          <p className="text-sm font-medium text-zinc-500">{s.label}</p>
          <p
            className={`mt-1 text-3xl font-semibold tracking-tight ${
              s.accent ? "text-amber-600" : ""
            }`}
          >
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}
