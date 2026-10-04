/**
 * Request validation schemas (zod). These run server-side before any
 * business logic — the client also validates, but never trust the client.
 */
import { z } from "zod";
import { LEAVE_TYPES } from "@/lib/leave";

/** Strict YYYY-MM-DD — dates travel as plain strings and become UTC midnight */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format");

export const applyLeaveSchema = z
  .object({
    type: z.enum(LEAVE_TYPES),
    startDate: isoDate,
    endDate: isoDate,
    reason: z.string().trim().min(3, "Reason must be at least 3 characters").max(500, "Reason must be under 500 characters"),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"], // error shows on the end-date field in the UI
  });

export type ApplyLeaveInput = z.infer<typeof applyLeaveSchema>;

/** "2026-10-04" → Date at UTC midnight (deterministic across timezones) */
export function toUtcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}
