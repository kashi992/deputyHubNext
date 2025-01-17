import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  OrganisationCacheKey
} from '@/data/caching';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import type { ApiKeyDto } from '@/types/dtos/api-key-dto';
import { SortDirection } from '@/types/sorty-direction';

export async function getApiKeys(): Promise<ApiKeyDto[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      const apiKeys = await prisma.apiKey.findMany({
        where: { organisationId: session.user.organisationId },
        select: {
          id: true,
          description: true,
          lastUsedAt: true,
          expiresAt: true
        },
        orderBy: {
          createdAt: SortDirection.Asc
        }
      });

      const response: ApiKeyDto[] = apiKeys.map((apiKey) => ({
        id: apiKey.id,
        description: apiKey.description,
        lastUsedAt: apiKey.lastUsedAt ?? undefined,
        expiresAt: apiKey.expiresAt ?? undefined
      }));

      return response;
    },
    Caching.createOrganisationKeyParts(
      OrganisationCacheKey.ApiKeys,
      session.user.organisationId
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganisationTag(
          OrganisationCacheKey.ApiKeys,
          session.user.organisationId
        )
      ]
    }
  )();
}
