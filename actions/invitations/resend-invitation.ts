'use server';

import { revalidateTag } from 'next/cache';
import { InvitationStatus } from '@prisma/client';

import { authActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { Caching, OrganisationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { sendInvitationEmail } from '@/lib/smtp/send-invitation-email';
import { getBaseUrl } from '@/lib/urls/get-base-url';
import { NotFoundError, PreConditionError } from '@/lib/validation/exceptions';
import { resendInvitationSchema } from '@/schemas/invitations/resend-invitation-schema';

export const resendInvitation = authActionClient
  .metadata({ actionName: 'resendInvitation' })
  .schema(resendInvitationSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organisation = await prisma.organisation.findFirst({
      where: { id: session.user.organisationId },
      select: { name: true }
    });
    if (!organisation) {
      throw new NotFoundError('Organisation not found');
    }

    const invitation = await prisma.invitation.findFirst({
      where: {
        id: parsedInput.id,
        organisationId: session.user.organisationId
      },
      select: {
        email: true,
        token: true,
        status: true
      }
    });
    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new PreConditionError('Invitation already accepted');
    }
    if (invitation.status === InvitationStatus.REVOKED) {
      throw new PreConditionError('Invitation was revoked');
    }

    await sendInvitationEmail({
      recipient: invitation.email,
      organisationName: organisation.name,
      invitedByEmail: session.user.email,
      invitedByName: session.user.name,
      inviteLink: `${getBaseUrl()}${Routes.InvitationRequest}/${invitation.token}`
    });

    await prisma.invitation.update({
      where: {
        id: parsedInput.id,
        organisationId: session.user.organisationId
      },
      data: { lastSentAt: new Date() },
      select: {
        id: true // SELECT NONE
      }
    });

    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.Invitations,
        session.user.organisationId
      )
    );
  });
