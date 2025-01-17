'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganisationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { deleteContactCommentSchema } from '@/schemas/contacts/delete-contact-comment-schema';

export const deleteContactComment = authActionClient
  .metadata({ actionName: 'deleteContactComment' })
  .schema(deleteContactCommentSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const count = await prisma.contactComment.count({
      where: {
        id: parsedInput.id,
        contact: {
          organisationId: session.user.organisationId
        }
      }
    });
    if (count < 1) {
      throw new NotFoundError('Contact comment not found');
    }

    const comment = await prisma.contactComment.delete({
      where: { id: parsedInput.id },
      select: { contactId: true }
    });

    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.ContactTimelineEvents,
        session.user.organisationId,
        comment.contactId
      )
    );
  });
