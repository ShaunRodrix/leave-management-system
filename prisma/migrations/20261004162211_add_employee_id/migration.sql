-- Add employeeId: stable human-readable identifier (1001+), assigned by
-- join order so existing rows are backfilled deterministically.
ALTER TABLE "users" ADD COLUMN "employeeId" INTEGER;

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt", id) + 1000 AS eid
  FROM "users"
)
UPDATE "users" u SET "employeeId" = numbered.eid FROM numbered WHERE numbered.id = u.id;

ALTER TABLE "users" ALTER COLUMN "employeeId" SET NOT NULL;

-- CreateUniqueIndex
CREATE UNIQUE INDEX "users_employeeId_key" ON "users"("employeeId");
