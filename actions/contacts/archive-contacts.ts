'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganisationCacheKey, UserCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { archiveContactsSchema } from '@/schemas/contacts/archive-contacts-schema';

export const archiveContacts = authActionClient
  .metadata({ actionName: 'archiveContacts' })
  .schema(archiveContactsSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const contacts = await prisma.contact.findMany({
      where: {
        organisationId: session.user.organisationId,
        id: { in: parsedInput.ids }
      }
    });

    if (contacts.length !== parsedInput.ids.length) {
      throw new NotFoundError('One or more contacts not found');
    }

    await prisma.contact.updateMany({
      where: { 
        id: { in: parsedInput.ids },
        organisationId: session.user.organisationId 
      },
      data: { archived: parsedInput.action === 'archive' }
    });

    // Revalidate organization contacts list
    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.Contacts,
        session.user.organisationId
      )
    );

    // Revalidate each individual contact
    parsedInput.ids.forEach(id => {
      revalidateTag(
        Caching.createOrganisationTag(
          OrganisationCacheKey.Contact,
          session.user.organisationId,
          id
        )
      );
    });

    revalidateTag(
      Caching.createUserTag(UserCacheKey.Pinned, session.user.id)
    );
  });
