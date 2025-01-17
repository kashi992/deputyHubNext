'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganisationCacheKey } from '@/data/caching';
import { updateContactAndCaptureEvent } from '@/lib/db/contact-event-capture';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateContactTagsSchema } from '@/schemas/contacts/update-contact-tags-schema';

export const updateContactTags = authActionClient
  .metadata({ actionName: 'updateContactTags' })
  .schema(updateContactTagsSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const contact = await prisma.contact.findFirst({
      where: {
        organisationId: session.user.organisationId,
        id: parsedInput.id
      },
      select: {
        tags: {
          select: {
            id: true,
            text: true
          }
        }
      }
    });
    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    await updateContactAndCaptureEvent(
      parsedInput.id,
      {
        tags: {
          connectOrCreate: parsedInput.tags.map((tag) => ({
            where: { text: tag.text },
            create: { text: tag.text }
          })),
          disconnect: contact.tags
            .filter(
              (tag) => !parsedInput.tags.map((t) => t.text).includes(tag.text)
            )
            .map((tag) => ({ id: tag.id }))
        }
      },
      session.user.id
    );

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
  });
