/**
 * Database seed: 1 admin, 5 employees, ~15 leave requests across all
 * statuses and types. Dates are relative to "today" so demo data always
 * looks live. Idempotent — safe to run multiple times.
 *
 * Run: npm run db:seed
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
  { name: "Shaun", email: "shaun@company.com" },
  { name: "Aviston", email: "aviston@company.com" },
  { name: "Rahul", email: "rahul@company.com" },
  { name: "Ananya", email: "ananya@company.com" },
  { name: "Annia", email: "annia@company.com" },
];

/** Demo password pattern: Name@1234 (capitalized first letter) */
function demoPassword(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1) + "@1234";
}

async function main() {
  const admin = await db.user.upsert({
    where: { email: "admin@company.com" },
    update: { name: "Admin", passwordHash: await bcrypt.hash("Admin@123", 10) },
    create: {
      name: "Admin",
      email: "admin@company.com",
      passwordHash: await bcrypt.hash("Admin@123", 10),
      role: "ADMIN",
    },
  });

  const employees = await Promise.all(
    EMPLOYEES.map((e) => {
      const passwordHash = bcrypt.hashSync(demoPassword(e.name), 10);
      return db.user.upsert({
        where: { email: e.email },
        update: { name: e.name, passwordHash },
        create: { ...e, passwordHash, role: "EMPLOYEE" },
      });
    })
  );

  // Leaves are always relative to "today", so wipe and recreate on every
  // seed run — keeps the demo data live instead of drifting as days pass.
  await db.leaveRequest.deleteMany({});

  const [shaun, aviston, rahul, ananya, annia] = employees;

  type Row = {
    userId: number;
    type: LeaveType;
    start: number; // day offsets from today
    end: number;
    status?: LeaveStatus;
    reason: string;
  };

  const rows: Row[] = [
    // Shaun — approved past leave, currently on approved leave, one pending
    { userId: shaun.id, type: "CASUAL", start: -20, end: -18, status: "APPROVED", reason: "Family function out of town" },
    { userId: shaun.id, type: "SICK", start: 0, end: 1, status: "APPROVED", reason: "Fever and cold" },
    { userId: shaun.id, type: "EARNED", start: 14, end: 18, reason: "Vacation trip planned with family" },

    // Aviston — mixed history
    { userId: aviston.id, type: "SICK", start: -9, end: -9, status: "APPROVED", reason: "Migraine" },
    { userId: aviston.id, type: "CASUAL", start: -4, end: -3, status: "REJECTED", reason: "Personal errand" },
    { userId: aviston.id, type: "CASUAL", start: 3, end: 3, reason: "Bank paperwork" },
    { userId: aviston.id, type: "SICK", start: 5, end: 6, status: "APPROVED", reason: "Migraine" },
    { userId: aviston.id, type: "EARNED", start: 30, end: 34, reason: "Wedding in the family" },

    // Rahul — pending queue for the admin dashboard
    { userId: rahul.id, type: "CASUAL", start: 2, end: 3, reason: "House shifting" },
    { userId: rahul.id, type: "SICK", start: -15, end: -14, status: "APPROVED", reason: "Food poisoning" },
    { userId: rahul.id, type: "EARNED", start: 21, end: 25, reason: "Annual vacation" },

    // Ananya — mostly approved, one pending
    { userId: ananya.id, type: "EARNED", start: -32, end: -28, status: "APPROVED", reason: "Travel abroad" },
    { userId: ananya.id, type: "CASUAL", start: -2, end: -1, status: "APPROVED", reason: "Sister's graduation" },
    { userId: ananya.id, type: "SICK", start: 1, end: 2, status: "APPROVED", reason: "Dental surgery recovery" },
    { userId: ananya.id, type: "CASUAL", start: 3, end: 5, status: "APPROVED", reason: "Trip with sister" },
    { userId: ananya.id, type: "EARNED", start: 21, end: 25, reason: "Annual vacation" },

    // Annia
    { userId: annia.id, type: "CASUAL", start: 5, end: 6, reason: "Apartment viewing" },
    { userId: annia.id, type: "CASUAL", start: 9, end: 10, status: "REJECTED", reason: "Weekend trip" },
    { userId: annia.id, type: "EARNED", start: -45, end: -43, status: "APPROVED", reason: "Personal" },
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
