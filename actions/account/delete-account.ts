'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganisationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';

export const deleteAccount = authActionClient
  .metadata({ actionName: 'deleteAccount' })
  .action(async ({ ctx: { session } }) => {
    await prisma.$transaction([
      prisma.invitation.deleteMany({
        where: { email: session.user.email }
      }),
      prisma.account.deleteMany({
        where: { userId: session.user.id }
      }),
      prisma.session.deleteMany({
        where: { userId: session.user.id }
      }),
      prisma.verificationToken.deleteMany({
        where: { identifier: session.user.email }
      }),
      prisma.changeEmailRequest.deleteMany({
        where: { userId: session.user.id }
      }),
      prisma.resetPasswordRequest.deleteMany({
        where: { email: session.user.email }
      }),
      prisma.user.deleteMany({
        where: { id: session.user.id }
      })
    ]);

    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.Members,
        session.user.organisationId
      )
    );

  });
