import * as React from 'react';
import { type Metadata } from 'next';
import { revalidateTag } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { InvitationStatus } from '@prisma/client';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';
import { validate as uuidValidate } from 'uuid';

import { AuthContainer } from '@/components/auth/auth-container';
import { JoinOrganisationCard } from '@/components/invitations/join-organisation-card';
import { Routes } from '@/constants/routes';
import { Caching, OrganisationCacheKey } from '@/data/caching';
import { dedupedAuth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { createTitle } from '@/lib/utils';
import type { NextPageProps } from '@/types/next-page-props';

const paramsCache = createSearchParamsCache({
  token: parseAsString.withDefault('')
});

export const metadata: Metadata = {
  title: createTitle('Join organisation')
};

export default async function InvitationPage({
  params
}: NextPageProps): Promise<React.JSX.Element> {
  const { token } = await paramsCache.parse(params);
  if (!token || !uuidValidate(token)) {
    return notFound();
  }

  const invitation = await prisma.invitation.findFirst({
    where: { token },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      organisation: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  if (!invitation) {
    return notFound();
  }

  if (invitation.status === InvitationStatus.ACCEPTED) {
    return redirect(Routes.InvitationAlreadyAccepted);
  }

  const [countUsers, countInvitations] = await prisma.$transaction([
    prisma.user.count({
      where: { email: invitation.email }
    }),
    prisma.invitation.count({
      where: {
        email: invitation.email,
        organisationId: invitation.organisation.id,
        AND: [
          { NOT: { token: { equals: token } } },
          { NOT: { status: { equals: InvitationStatus.ACCEPTED } } },
          { NOT: { status: { equals: InvitationStatus.REVOKED } } }
        ]
      }
    })
  ]);

  const isAvailable = countUsers === 0 && countInvitations === 0;
  if (!isAvailable) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.REVOKED }
    });
    invitation.status = InvitationStatus.REVOKED;
    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.Invitations,
        invitation.organisation.id
      )
    );
  }

  if (invitation.status === InvitationStatus.REVOKED) {
    return redirect(Routes.InvitationRevoked);
  }

  const session = await dedupedAuth();
  if (session) {
    return redirect(`${Routes.InvitationLogOutToAccept}?token=${token}`);
  }

  return (
    <AuthContainer maxWidth="md">
      <JoinOrganisationCard
        invitation={invitation}
        organisationName={invitation.organisation.name}
      />
    </AuthContainer>
  );
}
