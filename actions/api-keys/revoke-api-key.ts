'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganisationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { revokeApiKeySchema } from '@/schemas/api-keys/revoke-api-key-schema';

export const revokeApiKey = authActionClient
  .metadata({ actionName: 'revokeApiKey' })
  .schema(revokeApiKeySchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const count = await prisma.apiKey.count({
      where: {
        organisationId: session.user.organisationId,
        id: parsedInput.id
      }
    });
    if (count < 1) {
      throw new NotFoundError('API key not found');
    }

    await prisma.apiKey.delete({
      where: { id: parsedInput.id },
      select: {
        id: true // SELECT NONE
      }
    });

    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.ApiKeys,
        session.user.organisationId
      )
    );
  });
