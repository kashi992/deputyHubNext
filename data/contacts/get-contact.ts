import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { notFound, redirect } from 'next/navigation';

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
  getContactSchema,
  type GetContactSchema
} from '@/schemas/contacts/get-contact-schema';
import type { ContactDto } from '@/types/dtos/contact-dto';

export async function getContact(input: GetContactSchema): Promise<ContactDto> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const result = getContactSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(JSON.stringify(result.error.flatten()));
  }
  const parsedInput = result.data;

  return cache(
    async () => {
      const contact = await prisma.contact.findFirst({
        where: {
          organisationId: session.user.organisationId,
          id: parsedInput.id
        },
        select: {
          id: true,
          record: true,
          image: true,
          name: true,
          email: true,
          address: true,
          phone: true,
          stage: true,
          createdAt: true,
          archived: true,
          tags: {
            select: {
              id: true,
              text: true
            }
          },
          salutation: true,
          firstName: true,
          lastName: true,
          companyName: true,
          phone1: true,
          phone2: true,
          companyRegistrationNumber: true,
          pinned: {
            select: {
              id: true,
              order: true
            }
          },
          tasks: {
            select: {
              id: true,
              title: true,
              status: true
            }
          }
        }
      });
      if (!contact) {
        return notFound();
      }

      const response: ContactDto = {
        id: contact.id,
        record: contact.record,
        image: contact.image ? contact.image : undefined,
        email: contact.email ? contact.email : undefined,
        address: contact.address ? contact.address : undefined,
        phone: contact.phone ? contact.phone : undefined,
        stage: contact.stage ?? undefined,
        createdAt: contact.createdAt,
        archived: contact.archived,
        tags: contact.tags,
        salutation: contact.salutation ?? undefined,
        firstName: contact.firstName ?? undefined,
        lastName: contact.lastName ?? undefined,
        companyName: contact.companyName ?? undefined,
        phone1: contact.phone1 ?? undefined,
        phone2: contact.phone2 ?? undefined,
        companyRegistrationNumber: contact.companyRegistrationNumber ?? undefined,
      };

      return response;
    },
    Caching.createOrganisationKeyParts(
      OrganisationCacheKey.Contact,
      session.user.organisationId,
      parsedInput.id
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganisationTag(
          OrganisationCacheKey.Contact,
          session.user.organisationId,
          parsedInput.id
        )
      ]
    }
  )();
}
