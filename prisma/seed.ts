/**
 * Database seed: 1 admin, 4 employees, ~15 leave requests across all
 * statuses and types. Dates are relative to "today" so demo data always
 * looks live. Idempotent — safe to run multiple times.
 *
 * Run: npx prisma db seed
 */
import { PrismaClient, LeaveType, LeaveStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

/** UTC midnight of (today + offsetDays) */
function day(offset: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

/** Inclusive day count between two UTC-midnight dates */
function countDays(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

const EMPLOYEES = [
  { name: "Alex Fernandes", email: "alex@company.com" },
  { name: "Priya Sharma", email: "priya@company.com" },
  { name: "Sam Mathew", email: "sam@company.com" },
  { name: "Nina Varghese", email: "nina@company.com" },
];

async function main() {
  const adminHash = await bcrypt.hash("Admin@123", 10);
  const employeeHash = await bcrypt.hash("Employee@123", 10);

  const admin = await db.user.upsert({
    where: { email: "admin@company.com" },
    update: { passwordHash: adminHash },
    create: {
      name: "Sean Rodrigues",
      email: "admin@company.com",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  const employees = await Promise.all(
    EMPLOYEES.map((e) =>
      db.user.upsert({
        where: { email: e.email },
        update: { passwordHash: employeeHash },
        create: { ...e, passwordHash: employeeHash, role: "EMPLOYEE" },
      })
    )
  );

  // Skip leave creation if already seeded
  if ((await db.leaveRequest.count()) > 0) {
    console.log("Leave requests already seeded — skipping.");
    return;
  }

  const [alex, priya, sam, nina] = employees;

  type Row = {
    userId: number;
    type: LeaveType;
    start: number; // day offsets from today
    end: number;
    status?: LeaveStatus;
    reason: string;
  };

  const rows: Row[] = [
    // Alex — approved past leave, currently on approved leave, one pending
    { userId: alex.id, type: "CASUAL", start: -20, end: -18, status: "APPROVED", reason: "Family function out of town" },
    { userId: alex.id, type: "SICK", start: 0, end: 1, status: "APPROVED", reason: "Fever and cold" },
    { userId: alex.id, type: "EARNED", start: 14, end: 18, reason: "Vacation trip planned with family" },

    // Priya — mixed history
    { userId: priya.id, type: "SICK", start: -9, end: -9, status: "APPROVED", reason: "Migraine" },
    { userId: priya.id, type: "CASUAL", start: -4, end: -3, status: "REJECTED", reason: "Personal errand" },
    { userId: priya.id, type: "CASUAL", start: 6, end: 6, reason: "Bank paperwork" },
    { userId: priya.id, type: "EARNED", start: 30, end: 34, reason: "Wedding in the family" },

    // Sam — heavy pending queue for the admin dashboard
    { userId: sam.id, type: "CASUAL", start: 2, end: 3, reason: "House shifting" },
    { userId: sam.id, type: "SICK", start: -15, end: -14, status: "APPROVED", reason: "Food poisoning" },
    { userId: sam.id, type: "EARNED", start: 21, end: 25, reason: "Annual vacation" },

    // Nina — mostly approved, one rejected
    { userId: nina.id, type: "EARNED", start: -32, end: -28, status: "APPROVED", reason: "Travel abroad" },
    { userId: nina.id, type: "SICK", start: 4, end: 5, reason: "Dental surgery recovery" },
    { userId: nina.id, type: "CASUAL", start: -2, end: -1, status: "APPROVED", reason: "Sister's graduation" },
    { userId: nina.id, type: "CASUAL", start: 9, end: 10, status: "REJECTED", reason: "Weekend trip" },
    { userId: priya.id, type: "EARNED", start: -45, end: -43, status: "APPROVED", reason: "Personal" },
  ];

  await db.leaveRequest.createMany({
    data: rows.map((r) => ({
      userId: r.userId,
      type: r.type,
      startDate: day(r.start),
      endDate: day(r.end),
      days: countDays(day(r.start), day(r.end)),
      reason: r.reason,
      status: r.status ?? ("PENDING" as LeaveStatus),
      reviewedById: r.status ? admin.id : null,
      reviewedAt: r.status ? day(r.start - 2) : null,
    })),
  });

  console.log(`Seeded ${rows.length} leave requests for ${employees.length} employees + 1 admin.`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
