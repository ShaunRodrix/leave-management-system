import { describe, expect, it } from "vitest";
import {
  ENTITLEMENTS,
  computeBalances,
  countDays,
  rangesOverlap,
} from "@/lib/leave";

/** UTC-midnight helper — mirrors how the app stores dates */
const d = (iso: string) => new Date(iso);

describe("countDays", () => {
  it("counts a single day as 1", () => {
    expect(countDays(d("2026-10-04"), d("2026-10-04"))).toBe(1);
  });

  it("counts an inclusive range within a month", () => {
    // 4, 5, 6 Oct = 3 days
    expect(countDays(d("2026-10-04"), d("2026-10-06"))).toBe(3);
  });

  it("counts correctly across a month boundary", () => {
    // 30 Sep + 1, 2 Oct = 3 days
    expect(countDays(d("2026-09-30"), d("2026-10-02"))).toBe(3);
  });

  it("counts correctly across a year boundary", () => {
    // 30 Dec 2026 + 1, 2 Jan 2027 = 4 days
    expect(countDays(d("2026-12-30"), d("2027-01-02"))).toBe(4);
  });

  it("counts a full working week", () => {
    expect(countDays(d("2026-10-05"), d("2026-10-09"))).toBe(5);
  });
});

describe("rangesOverlap", () => {
  it("detects direct overlap", () => {
    expect(
      rangesOverlap(d("2026-10-04"), d("2026-10-08"), d("2026-10-07"), d("2026-10-10"))
    ).toBe(true);
  });

  it("detects containment (one range inside another)", () => {
    expect(
      rangesOverlap(d("2026-10-01"), d("2026-10-31"), d("2026-10-10"), d("2026-10-12"))
    ).toBe(true);
  });

  it("treats touching edge dates as overlapping", () => {
    // a ends Oct 5, b starts Oct 5 — the day is shared, so blocked
    expect(
      rangesOverlap(d("2026-10-01"), d("2026-10-05"), d("2026-10-05"), d("2026-10-08"))
    ).toBe(true);
  });

  it("allows adjacent, non-overlapping leave", () => {
    // a ends Oct 5, b starts Oct 6 — no shared day
    expect(
      rangesOverlap(d("2026-10-01"), d("2026-10-05"), d("2026-10-06"), d("2026-10-08"))
    ).toBe(false);
  });

  it("detects fully disjoint ranges", () => {
    expect(
      rangesOverlap(d("2026-01-01"), d("2026-01-10"), d("2026-06-01"), d("2026-06-10"))
    ).toBe(false);
  });
});

describe("computeBalances", () => {
  it("returns full entitlements when nothing is used", () => {
    const b = computeBalances([]);
    expect(b.CASUAL).toEqual({ entitlement: 12, used: 0, remaining: 12 });
    expect(b.SICK).toEqual({ entitlement: 10, used: 0, remaining: 10 });
    expect(b.EARNED).toEqual({ entitlement: 6, used: 0, remaining: 6 });
  });

  it("deducts approved days per type", () => {
    const b = computeBalances([
      { type: "CASUAL", days: 3 },
      { type: "CASUAL", days: 2 },
    ]);
    expect(b.CASUAL.used).toBe(5);
    expect(b.CASUAL.remaining).toBe(7);
    expect(b.SICK.remaining).toBe(ENTITLEMENTS.SICK);
  });

  it("keeps types independent", () => {
    const b = computeBalances([
      { type: "SICK", days: 10 },
      { type: "EARNED", days: 1 },
    ]);
    expect(b.SICK.remaining).toBe(0);
    expect(b.EARNED.remaining).toBe(5);
    expect(b.CASUAL.remaining).toBe(12);
  });
});
