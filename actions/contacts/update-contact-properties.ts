'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganisationCacheKey, UserCacheKey } from '@/data/caching';
import { updateContactAndCaptureEvent } from '@/lib/db/contact-event-capture';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateContactPropertiesSchema } from '@/schemas/contacts/update-contact-properties-schema';

export const updateContactProperties = authActionClient
  .metadata({ actionName: 'updateContactProperties' })
  .schema(updateContactPropertiesSchema)
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
      {
        record: parsedInput.record,
        email: parsedInput.email,
        address: parsedInput.address,
        phone: parsedInput.phone,
        salutation: parsedInput.salutation,
        firstName: parsedInput.firstName,  
        lastName: parsedInput.lastName,
        companyName: parsedInput.companyName,
        companyRegistrationNumber: parsedInput.companyRegistrationNumber,
        phone1: parsedInput.phone1,
        phone2: parsedInput.phone2
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
    revalidateTag(
      Caching.createUserTag(UserCacheKey.Pinned, session.user.id)
    );
  });
