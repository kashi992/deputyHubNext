import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  UserCacheKey
} from '@/data/caching';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import type { PinnedDto } from '@/types/dtos/pinned-dto';
import { SortDirection } from '@/types/sorty-direction';

export async function getPinned(): Promise<PinnedDto[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      const pinned = await prisma.pinned.findMany({
        where: { userId: session.user.id },
        select: {
          id: true,
          order: true,
          contact: {
            select: {
              id: true,
              name: true,
              record: true,
              image: true
            }
          }
        },
        orderBy: {
          order: SortDirection.Asc
        }
      });

      const mapped: PinnedDto[] = pinned.map((pinned) => ({
        id: pinned.id,
        order: pinned.order,
        contactId: pinned.contact.id,
        name: pinned.contact.name,
        record: pinned.contact.record,
        image: pinned.contact.image ? pinned.contact.image : undefined
      }));

      return mapped;
    },
    Caching.createUserKeyParts(UserCacheKey.Pinned, session.user.id),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [Caching.createUserTag(UserCacheKey.Pinned, session.user.id)]
    }
  )();
}
