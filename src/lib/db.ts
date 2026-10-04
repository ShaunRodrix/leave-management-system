import { PrismaClient } from "@prisma/client";

// Singleton pattern: Next.js dev mode hot-reloads modules, which would create
// a new PrismaClient (and new DB connections) on every change and exhaust the
// database. Storing the client on globalThis survives reloads in dev only.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
