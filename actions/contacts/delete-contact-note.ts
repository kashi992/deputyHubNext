'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganisationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { deleteContactNoteSchema } from '@/schemas/contacts/delete-contact-note-schema';

export const deleteContactNote = authActionClient
  .metadata({ actionName: 'deleteContactNote' })
  .schema(deleteContactNoteSchema)
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
      throw new NotFoundError('Contact note not found');
    }

    const note = await prisma.contactNote.delete({
      where: { id: parsedInput.id },
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
