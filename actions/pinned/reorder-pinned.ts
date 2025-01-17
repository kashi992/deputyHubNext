'use server';

import { revalidateTag } from 'next/cache';
import { type Prisma } from '@prisma/client';

import { authActionClient } from '@/actions/safe-action';
import { Caching, UserCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { updatePinnedOrder } from '@/lib/db/update-pinned-order';
import { reorderPinnedSchema } from '@/schemas/pinned/reorder-pinned-schema';

export const reorderPinned = authActionClient
  .metadata({ actionName: 'reorderPinned' })
  .schema(reorderPinnedSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const pinned = await prisma.pinned.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        id: true
      }
    });

    const updates: Prisma.PrismaPromise<unknown>[] = [];
    for (const pinnedItem of parsedInput.pinned) {
      if (pinned.some((p) => p.id === pinnedItem.id)) {
        updates.push(
          prisma.pinned.update({
            where: { id: pinnedItem.id },
            data: { order: pinnedItem.order }
          })
        );
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction([
        ...updates,
        updatePinnedOrder(session.user.id)
      ]);

      revalidateTag(
        Caching.createUserTag(UserCacheKey.Pinned, session.user.id)
      );
    }
  });
