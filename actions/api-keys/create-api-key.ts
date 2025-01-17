'use server';

import { revalidateTag } from 'next/cache';
import { startOfDay } from 'date-fns';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganisationCacheKey } from '@/data/caching';
import { generateApiKey, hashApiKey } from '@/lib/auth/api-keys';
import { prisma } from '@/lib/db/prisma';
import { createApiKeySchema } from '@/schemas/api-keys/create-api-key-schema';

export const createApiKey = authActionClient
  .metadata({ actionName: 'createApiKey' })
  .schema(createApiKeySchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const apiKey = generateApiKey();
    await prisma.apiKey.create({
      data: {
        description: parsedInput.description,
        hashedKey: hashApiKey(apiKey),
        expiresAt: parsedInput.neverExpires
          ? null
          : startOfDay(parsedInput.expiresAt ?? new Date()),
        organisationId: session.user.organisationId
      },
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

    return { apiKey };
  });
