'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, UserCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { updatePinnedOrder } from '@/lib/db/update-pinned-order';
import { removePinnedSchema } from '@/schemas/pinned/remove-pinned-schema';

export const removePinned = authActionClient
  .metadata({ actionName: 'removePinned' })
  .schema(removePinnedSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    await prisma.$transaction([
      prisma.pinned.deleteMany({
        where: {
          userId: session.user.id,
          contactId: parsedInput.contactId
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
