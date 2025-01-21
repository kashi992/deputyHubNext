'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganisationCacheKey, UserCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { archiveContactSchema } from '@/schemas/contacts/archive-contact-schema';

export const archiveContact = authActionClient
  .metadata({ actionName: 'archiveContact' })
  .schema(archiveContactSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const contact = await prisma.contact.findFirst({
      where: {
        organisationId: session.user.organisationId,
        id: parsedInput.id
      }
    });

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    await prisma.contact.update({
      where: { id: parsedInput.id },
      data: { archived: true }
    });

    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.Contacts,
        session.user.organisationId
      )
    );

    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.Contact,
        session.user.organisationId,
        parsedInput.id
      )
    );

    revalidateTag(
      Caching.createUserTag(UserCacheKey.Pinned, session.user.id)
    );
  });
