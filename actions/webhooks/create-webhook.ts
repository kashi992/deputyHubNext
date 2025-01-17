'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganisationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { createWebhookSchema } from '@/schemas/webhooks/create-webhook-schema';

export const createWebhook = authActionClient
  .metadata({ actionName: 'createWebhook' })
  .schema(createWebhookSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    await prisma.webhook.create({
      data: {
        organisationId: session.user.organisationId,
        url: parsedInput.url,
        triggers: parsedInput.triggers ? parsedInput.triggers : [],
        secret: parsedInput.secret ? parsedInput.secret : null
      },
      select: {
        id: true // SELECT NONE
      }
    });

    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.Webhooks,
        session.user.organisationId
      )
    );
  });
