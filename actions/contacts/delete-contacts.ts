'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganisationCacheKey, UserCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { deleteContactsSchema } from '@/schemas/contacts/delete-contacts-schema';

export const deleteContacts = authActionClient
  .metadata({ actionName: 'deleteContacts' })
  .schema(deleteContactsSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    await prisma.contact.deleteMany({
      where: {
        id: {
          in: parsedInput.ids
        },
        organisationId: session.user.organisationId
      }
    });

    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.Contacts,
        session.user.organisationId
      )
    );

    for (const id of parsedInput.ids) {
      revalidateTag(
        Caching.createOrganisationTag(
          OrganisationCacheKey.Contact,
          session.user.organisationId,
          id
        )
      );
    }

    revalidateTag(
      Caching.createUserTag(UserCacheKey.Pinned, session.user.id)
    );
  });
