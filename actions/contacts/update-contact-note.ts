'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganisationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateContactCommentSchema } from '@/schemas/contacts/update-contact-comment-schema';

export const updateContactNote = authActionClient
  .metadata({ actionName: 'updateContactNote' })
  .schema(updateContactCommentSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const count = await prisma.contactNote.count({
      where: {
        id: parsedInput.id,
        contact: {
          organisationId: session.user.organisationId
        }
      }
    });
    if (count < 1) {
      throw new NotFoundError('Contact not not found');
    }

    const note = await prisma.contactNote.update({
      where: { id: parsedInput.id },
      data: { text: parsedInput.text },
      select: { contactId: true }
    });

    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.ContactNotes,
        session.user.organisationId,
        note.contactId
      )
    );
  });
