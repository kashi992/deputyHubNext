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
import { NotFoundError } from '@/lib/validation/exceptions';
import type { OrganisationDetailsDto } from '@/types/dtos/organisation-details-dto';

export async function getOrganisationDetails(): Promise<OrganisationDetailsDto> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      const organisation = await prisma.organisation.findFirst({
        where: { id: session.user.organisationId },
        select: {
          name: true,
          address: true,
          phone: true,
          email: true,
          website: true
        }
      });
      if (!organisation) {
        throw new NotFoundError('Organisation not found');
      }

      const response: OrganisationDetailsDto = {
        name: organisation.name,
        address: organisation.address ? organisation.address : undefined,
        phone: organisation.phone ? organisation.phone : undefined,
        email: organisation.email ? organisation.email : undefined,
        website: organisation.website ? organisation.website : undefined
      };

      return response;
    },
    Caching.createOrganisationKeyParts(
      OrganisationCacheKey.OrganisationDetails,
      session.user.organisationId
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganisationTag(
          OrganisationCacheKey.OrganisationDetails,
          session.user.organisationId
        )
      ]
    }
  )();
}
