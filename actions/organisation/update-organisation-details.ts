'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganisationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateOrganisationDetailsSchema } from '@/schemas/organisation/update-organisation-details-schema';

export const updateOrganisationDetails = authActionClient
  .metadata({ actionName: 'updateOrganisationDetails' })
  .schema(updateOrganisationDetailsSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organisation = await prisma.organisation.findFirst({
      where: { id: session.user.organisationId },
      select: {
        name: true
      }
    });
    if (!organisation) {
      throw new NotFoundError('Organisation not found');
    }

    await prisma.organisation.update({
      where: { id: session.user.organisationId },
      data: {
        name: parsedInput.name,
        address: parsedInput.address,
        phone: parsedInput.phone,
        email: parsedInput.email,
        website: parsedInput.website
      },
      select: {
        id: true // SELECT NONE
      }
    });

    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.OrganisationDetails,
        session.user.organisationId
      )
    );
  });
