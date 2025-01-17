'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganisationCacheKey, UserCacheKey } from '@/data/caching';
import { createContactAndCaptureEvent } from '@/lib/db/contact-event-capture';
import { addContactSchema } from '@/schemas/contacts/add-contact-schema';

export const addContact = authActionClient
  .metadata({ actionName: 'addContact' })
  .schema(addContactSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    await createContactAndCaptureEvent(
      {
        record: parsedInput.record,
        salutation: parsedInput.salutation,
        firstName: parsedInput.firstName,
        lastName: parsedInput.lastName,
        companyName: parsedInput.companyName,
        email: parsedInput.email,
        phone1: parsedInput.phone1,
        phone2: parsedInput.phone2,
        address: parsedInput.address,
        companyRegistrationNumber: parsedInput.companyRegistrationNumber,
        organisation: {
          connect: {
            id: session.user.organisationId
          }
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
      Caching.createUserTag(UserCacheKey.Pinned, session.user.id)
    );
  });
