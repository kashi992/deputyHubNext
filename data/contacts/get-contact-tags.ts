import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  OrganisationCacheKey
} from '@/data/caching';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import type { TagDto } from '@/types/dtos/tag-dto';
import { SortDirection } from '@/types/sorty-direction';

export async function getContactTags(): Promise<TagDto[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      const [contactTags] = await prisma.$transaction(
        [
          prisma.contactTag.findMany({
            where: {
              contacts: {
                some: {
                  organisationId: session.user.organisationId
                }
              }
            },
            select: {
              id: true,
              text: true
            },
            orderBy: {
              text: SortDirection.Asc
            }
          })
        ],
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadUncommitted
        }
      );

      return contactTags;
    },
    Caching.createOrganisationKeyParts(
      OrganisationCacheKey.ContactTags,
      session.user.organisationId
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganisationTag(
          OrganisationCacheKey.ContactTags,
          session.user.organisationId
        ),
        Caching.createOrganisationTag(
          OrganisationCacheKey.Contacts,
          session.user.organisationId
        )
      ]
    }
  )();
}
