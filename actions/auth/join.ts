'use server';

import { revalidateTag } from 'next/cache';
import { InvitationStatus } from '@prisma/client';

import { actionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { Caching, OrganisationCacheKey } from '@/data/caching';
import { signIn } from '@/lib/auth';
import { joinOrganisation } from '@/lib/auth/organisation';
import { hashPassword } from '@/lib/auth/password';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError, PreConditionError } from '@/lib/validation/exceptions';
import { joinSchema } from '@/schemas/auth/join-schema';
import { IdentityProvider } from '@/types/identity-provider';

export const join = actionClient
  .metadata({ actionName: 'join' })
  .schema(joinSchema)
  .action(async ({ parsedInput }) => {
    const invitation = await prisma.invitation.findFirst({
      where: { id: parsedInput.invitationId },
      select: {
        status: true,
        email: true,
        role: true,
        organisationId: true
      }
    });
    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }
    if (invitation.status === InvitationStatus.REVOKED) {
      throw new PreConditionError('Invitation was revoked');
    }
    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new PreConditionError('Invitation was already accepted');
    }
    const countOrganisation = await prisma.organisation.count({
      where: { id: invitation.organisationId }
    });
    if (countOrganisation < 1) {
      throw new NotFoundError('Organisation not found');
    }

    const normalizedEmail = invitation.email.toLowerCase();
    const hashedPassword = await hashPassword(parsedInput.password);

    const existingUser = await prisma.user.findFirst({
      where: { email: normalizedEmail }
    });
    if (existingUser) {
      throw new PreConditionError('Email address is already registered');
    }

    await joinOrganisation({
      invitationId: parsedInput.invitationId,
      organisationId: invitation.organisationId,
      name: parsedInput.name,
      normalizedEmail,
      hashedPassword,
      role: invitation.role
    });

    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.Members,
        invitation.organisationId
      )
    );
    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.Invitations,
        invitation.organisationId
      )
    );

    return await signIn(IdentityProvider.Credentials, {
      email: parsedInput.email,
      password: parsedInput.password,
      redirect: true,
      redirectTo: Routes.Onboarding
    });
  });
