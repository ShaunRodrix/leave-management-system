/**
 * Leave domain logic — pure functions, no database access.
 * This is the business core of the app; everything else (API routes,
 * UI) consumes these. Kept pure so it is trivially unit-testable.
 */

export const LEAVE_TYPES = ["CASUAL", "SICK", "EARNED"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

/** Annual entitlement per leave type, in calendar days */
export const ENTITLEMENTS: Record<LeaveType, number> = {
  CASUAL: 12,
  SICK: 10,
  EARNED: 6,
};

const MS_PER_DAY = 86_400_000;

/**
 * Inclusive day count between two dates.
 * countDays(Oct 4, Oct 6) === 3 — both endpoints count.
 * Math.round guards against any sub-day time components or DST shifts.
 */
export function countDays(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
}

/**
 * True when two date ranges share at least one day.
 * Touching edge dates (a ends where b starts) DO share that day → overlap.
 * Standard interval intersection: aStart <= bEnd AND bStart <= aEnd.
 */
export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart.getTime() <= bEnd.getTime() && bStart.getTime() <= aEnd.getTime();
}

export type LeaveBalance = {
  entitlement: number;
  used: number;
  remaining: number;
};

/**
 * Balances are COMPUTED from approved requests, never stored.
 * A stored counter would drift every time a leave is rejected or
 * cancelled; this derivation has a single source of truth.
 */
export function computeBalances(
  approved: { type: LeaveType; days: number }[]
): Record<LeaveType, LeaveBalance> {
  const used: Record<LeaveType, number> = { CASUAL: 0, SICK: 0, EARNED: 0 };
  for (const row of approved) {
    used[row.type] += row.days;
  }
  return {
    CASUAL: {
      entitlement: ENTITLEMENTS.CASUAL,
      used: used.CASUAL,
      remaining: ENTITLEMENTS.CASUAL - used.CASUAL,
    },
    SICK: {
      entitlement: ENTITLEMENTS.SICK,
      used: used.SICK,
      remaining: ENTITLEMENTS.SICK - used.SICK,
    },
    EARNED: {
      entitlement: ENTITLEMENTS.EARNED,
      used: used.EARNED,
      remaining: ENTITLEMENTS.EARNED - used.EARNED,
    },
  };
}
