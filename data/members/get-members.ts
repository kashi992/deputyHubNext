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
import type { MemberDto } from '@/types/dtos/member-dto';
import { SortDirection } from '@/types/sorty-direction';

export async function getMembers(): Promise<MemberDto[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      const members = await prisma.user.findMany({
        where: { organisationId: session.user.organisationId },
        select: {
          id: true,
          image: true,
          name: true,
          email: true,
          role: true,
          lastLogin: true,
          createdAt: true
        },
        orderBy: {
          createdAt: SortDirection.Asc
        }
      });

      const response: MemberDto[] = members.map((member) => ({
        id: member.id,
        image: member.image ?? undefined,
        name: member.name,
        email: member.email!,
        role: member.role,
        dateAdded: member.createdAt,
        lastLogin: member.lastLogin ?? undefined
      }));

      return response;
    },
    Caching.createOrganisationKeyParts(
      OrganisationCacheKey.Members,
      session.user.organisationId
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganisationTag(
          OrganisationCacheKey.Members,
          session.user.organisationId
        )
      ]
    }
  )();
}
