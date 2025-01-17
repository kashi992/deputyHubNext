'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, UserCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { updatePinnedOrder } from '@/lib/db/update-pinned-order';
import { addPinnedSchema } from '@/schemas/pinned/add-pinned-schema';

export const addPinned = authActionClient
  .metadata({ actionName: 'addPinned' })
  .schema(addPinnedSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const count = await prisma.pinned.count({
      where: {
        userId: session.user.id,
        contactId: parsedInput.contactId
      }
    });

    // already added
    if (count > 0) {
      return;
    }

    await prisma.$transaction([
      prisma.pinned.deleteMany({
        where: {
          userId: session.user.id,
          contactId: parsedInput.contactId
        }
      }),
      prisma.pinned.create({
        data: {
          userId: session.user.id,
          contactId: parsedInput.contactId,
          order: await prisma.pinned.count({
            where: { userId: session.user.id }
          })
        },
        select: {
          id: true // SELECT NONE
        }
      }),
      updatePinnedOrder(session.user.id)
    ]);

    revalidateTag(
      Caching.createUserTag(UserCacheKey.Pinned, session.user.id)
    );

    revalidateTag(
      Caching.createUserTag(
        UserCacheKey.ContactIsInPinned,
        session.user.id,
        parsedInput.contactId
      )
    );
  });
