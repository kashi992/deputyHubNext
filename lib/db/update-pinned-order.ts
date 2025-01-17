import { type Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

export function updatePinnedOrder(
  userId?: string
): Prisma.PrismaPromise<number> {
  if (userId) {
    return prisma.$executeRawUnsafe(
      `UPDATE "public"."Pinned"
        SET "order" = numbered_table.new_order
        FROM (
          SELECT id, ROW_NUMBER() OVER (ORDER BY "order" ASC) AS new_order
          FROM "public"."Pinned"
          WHERE "public"."Pinned"."userId" = $1::uuid
        ) numbered_table
        WHERE "public"."Pinned".id = numbered_table.id
        AND "public"."Pinned"."userId" = $1::uuid;`,
      userId
    );
  }

  return prisma.$executeRawUnsafe(
    `UPDATE "public"."Pinned"
      SET "order" = numbered_table.new_order
      FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "order" ASC) AS new_order
        FROM "public"."Pinned"
      ) numbered_table
      WHERE "public"."Pinned".id = numbered_table.id;`
  );
}
