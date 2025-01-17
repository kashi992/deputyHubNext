'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganisationCacheKey, UserCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { deleteContactSchema } from '@/schemas/contacts/delete-contact-schema';

export const deleteContact = authActionClient
  .metadata({ actionName: 'deleteContact' })
  .schema(deleteContactSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const count = await prisma.contact.count({
      where: {
        organisationId: session.user.organisationId,
        id: parsedInput.id
      }
    });
    if (count < 1) {
      throw new NotFoundError('Contact not found');
    }

    await prisma.$transaction([
      prisma.contactImage.deleteMany({
        where: { contactId: parsedInput.id }
      }),
      prisma.contact.delete({
        where: { id: parsedInput.id },
        select: {
          id: true // SELECT NONE
        }
      })
    ]);

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
