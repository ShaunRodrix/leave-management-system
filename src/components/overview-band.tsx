import type { Overview } from "@/lib/leave-queries";

const WEEKDAY = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  timeZone: "UTC",
});

/* Chart geometry: viewBox units (stretched to container width via
   preserveAspectRatio="none"; strokes stay crisp via non-scaling-stroke).
   TOP_PAD keeps the stroke and dot inside the plot when a day hits the max. */
const W = 700;
const H = 100;
const TOP_PAD = 12;

/** Catmull-Rom → cubic bézier: smooth curve through every point */
function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C ${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${
      p2[0] - (p3[0] - p1[0]) / 6
    },${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/**
 * Admin overview band — two zones, fixed size at any headcount:
 * headline numbers + year composition on the left, and a 7-day line
 * chart of how many people are out each day on the right (counts only,
 * never names — a dot turns amber when pending requests are in that
 * day's mix). Server component: no state, no client JS.
 */
export function OverviewBand({ data }: { data: Overview }) {
  const { pendingCount, onLeaveToday, totalEmployees, year, week } = data;
  const yearTotal = Math.max(year.approved + year.pending + year.rejected, 1);
  const maxOut = Math.max(...week.map((d) => d.approved + d.pending), 1);

  const yFor = (v: number) => 100 - (v / maxOut) * (100 - TOP_PAD);
  const pts = week.map(
    (d, i) => [(i + 0.5) * (W / 7), yFor(d.approved + d.pending)] as [number, number]
  );
  const line = smoothPath(pts);
  const area = `${line} L ${W},${H} L 0,${H} Z`;
  const xPct = (i: number) => ((i + 0.5) / 7) * 100;

  return (
    <div className="grid divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white lg:grid-cols-[210px_1fr] lg:divide-x lg:divide-y-0">
      <div className="flex flex-col p-5">
        <Headline value={pendingCount} label="Pending approvals" accent={pendingCount > 0} />
        <Headline value={onLeaveToday} label="On leave today" />
        <Headline value={totalEmployees} label="Employees" />
        <div className="mt-auto pt-5">
          <div className="flex h-1.5 overflow-hidden rounded-full bg-zinc-100">
            <div className="bg-emerald-500" style={{ width: `${(year.approved / yearTotal) * 100}%` }} />
            <div className="bg-amber-500" style={{ width: `${(year.pending / yearTotal) * 100}%` }} />
            <div className="bg-rose-500" style={{ width: `${(year.rejected / yearTotal) * 100}%` }} />
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {year.approved} approved · {year.pending} pending · {year.rejected} rejected
          </p>
          <p className="mt-0.5 text-xs font-medium text-zinc-700">
            {year.daysGranted} leave days taken
          </p>
        </div>
      </div>

      <div className="flex flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-zinc-500">Team out · next 7 days</p>
          <div className="flex items-center gap-3 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded bg-zinc-900" /> out
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full border border-white bg-amber-400 shadow-sm" />
              pending in mix
            </span>
          </div>
        </div>

        <div
          className="relative mt-3 h-36"
          role="img"
          aria-label={`People out over the next 7 days: ${week
            .map((d) => `${WEEKDAY.format(d.date)} ${d.approved + d.pending}`)
            .join(", ")}`}
        >
          {/* plot area */}
          <div className="absolute inset-x-0 top-4 bottom-0">
            {week.map(
              (d, i) =>
                d.isWeekend && (
                  <div
                    key={d.date.toISOString()}
                    className="absolute inset-y-0 rounded-md bg-zinc-50"
                    style={{ left: `${(i / 7) * 100}%`, width: `${100 / 7}%` }}
                  />
                )
            )}
            <div className="absolute inset-x-0 top-0 border-t border-zinc-100" />
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-zinc-100" />
            <div className="absolute inset-x-0 bottom-0 border-t border-zinc-200" />
            <div
              className="absolute inset-y-0 border-l border-dashed border-zinc-300"
              style={{ left: `${xPct(0)}%` }}
            />

            <svg
              className="absolute inset-0 h-full w-full"
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="ov-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#18181b" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#18181b" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={area} fill="url(#ov-area)" />
              <path
                d={line}
                fill="none"
                stroke="#18181b"
                strokeWidth="2"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {week.map((d, i) => {
              const total = d.approved + d.pending;
              return (
                <div
                  key={d.date.toISOString()}
                  className="absolute"
                  style={{ left: `${xPct(i)}%`, top: `${yFor(total)}%` }}
                >
                  <span
                    title={`${WEEKDAY.format(d.date)} ${d.date.getUTCDate()} · ${d.approved} approved, ${d.pending} pending`}
                    className={`absolute left-0 top-0 block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm ${
                      d.pending > 0 ? "bg-amber-400" : "bg-zinc-900"
                    }`}
                  />
                  <span
                    className={`absolute left-0 top-0 -translate-x-1/2 -translate-y-[190%] text-[10px] font-semibold tabular-nums ${
                      total === 0 ? "text-zinc-300" : "text-zinc-700"
                    }`}
                  >
                    {total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-2 grid grid-cols-7">
          {week.map((d, i) => (
            <div key={d.date.toISOString()} className="text-center">
              <p
                className={`text-[11px] font-medium ${
                  i === 0 ? "text-zinc-900" : d.isWeekend ? "text-zinc-400" : "text-zinc-500"
                }`}
              >
                {i === 0 ? "Today" : WEEKDAY.format(d.date)}
              </p>
              <p className="text-[11px] tabular-nums text-zinc-400">{d.date.getUTCDate()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Headline({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between border-b border-zinc-100 py-2 first:pt-0 last:border-b-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span
        className={`text-2xl font-semibold tabular-nums tracking-tight ${
          accent ? "text-amber-600" : "text-zinc-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
