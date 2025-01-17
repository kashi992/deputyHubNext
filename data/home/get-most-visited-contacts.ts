import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { endOfDay, startOfDay } from 'date-fns';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  OrganisationCacheKey
} from '@/data/caching';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { ValidationError } from '@/lib/validation/exceptions';
import {
  getMostVisitedContactsSchema,
  type GetMostVisitedContactsSchema
} from '@/schemas/home/get-most-vistied-contacts-schema';
import type { VisitedContactDto } from '@/types/dtos/visited-contact-dto';
import { SortDirection } from '@/types/sorty-direction';

export async function getMostVisitedContacts(
  input: GetMostVisitedContactsSchema
): Promise<VisitedContactDto[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const result = getMostVisitedContactsSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(JSON.stringify(result.error.flatten()));
  }
  const parsedInput = result.data;

  return cache(
    async () => {
      const [contacts] = await prisma.$transaction(
        [
          prisma.contact.findMany({
            where: { organisationId: session.user.organisationId },
            select: {
              id: true,
              name: true,
              image: true,
              record: true,
              _count: {
                select: {
                  pageVisits: {
                    where: {
                      timestamp: {
                        gte: startOfDay(parsedInput.from),
                        lte: endOfDay(parsedInput.to)
                      }
                    }
                  }
                }
              }
            },
            orderBy: {
              pageVisits: {
                _count: SortDirection.Desc
              }
            },
            take: 6
          })
        ],
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadUncommitted
        }
      );

      const response: VisitedContactDto[] = contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        image: contact.image ?? undefined,
        record: contact.record,
        pageVisits: contact._count.pageVisits
      }));
      return response;
    },
    Caching.createOrganisationKeyParts(
      OrganisationCacheKey.ContactPageVisits,
      session.user.organisationId,
      parsedInput.from.toISOString(),
      parsedInput.to.toISOString()
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganisationTag(
          OrganisationCacheKey.ContactPageVisits,
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
