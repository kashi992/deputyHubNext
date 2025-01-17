'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganisationCacheKey } from '@/data/caching';
import { updateContactAndCaptureEvent } from '@/lib/db/contact-event-capture';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateContactStageSchema } from '@/schemas/contacts/update-contact-stage-schema';

export const updateContactStage = authActionClient
  .metadata({ actionName: 'updateContactStage' })
  .schema(updateContactStageSchema)
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

    await updateContactAndCaptureEvent(
      parsedInput.id,
      { stage: parsedInput.stage },
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
