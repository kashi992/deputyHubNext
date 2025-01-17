'use server';

import { revalidateTag } from 'next/cache';
import { InvitationStatus, Role } from '@prisma/client';

import { authActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { Caching, OrganisationCacheKey } from '@/data/caching';
import { isAdmin } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';
import { sendInvitationEmail } from '@/lib/smtp/send-invitation-email';
import { getBaseUrl } from '@/lib/urls/get-base-url';
import {
  ForbiddenError,
  NotFoundError,
  PreConditionError
} from '@/lib/validation/exceptions';
import { sendInvitationSchema } from '@/schemas/invitations/send-invitation-schema';

export const sendInvitation = authActionClient
  .metadata({ actionName: 'sendInvitation' })
  .schema(sendInvitationSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    if (parsedInput.role === Role.ADMIN && !(await isAdmin(session.user.id))) {
      throw new ForbiddenError('Insufficient permissions');
    }

    const [countUsers, countInvitations] = await prisma.$transaction([
      prisma.user.count({
        where: {
          email: parsedInput.email
        }
      }),
      prisma.invitation.count({
        where: {
          email: parsedInput.email,
          organisationId: session.user.organisationId,
          status: {
            not: InvitationStatus.REVOKED
          }
        }
      })
    ]);
    if (countUsers > 0 || countInvitations > 0) {
      throw new PreConditionError('Email address is already taken');
    }

    const organisation = await prisma.organisation.findFirst({
      where: { id: session.user.organisationId },
      select: { name: true }
    });
    if (!organisation) {
      throw new NotFoundError('Organisation not found');
    }

    const [, invitation] = await prisma.$transaction([
      prisma.invitation.updateMany({
        where: {
          organisationId: session.user.organisationId,
          email: parsedInput.email,
          AND: [
            { NOT: { status: { equals: InvitationStatus.ACCEPTED } } },
            { NOT: { status: { equals: InvitationStatus.REVOKED } } }
          ]
        },
        data: {
          status: InvitationStatus.REVOKED
        }
      }),
      prisma.invitation.create({
        data: {
          email: parsedInput.email,
          role: parsedInput.role,
          organisationId: session.user.organisationId
        },
        select: {
          id: true,
          role: true,
          email: true,
          token: true
        }
      })
    ]);

    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.Invitations,
        session.user.organisationId
      )
    );

    await sendInvitationEmail({
      recipient: parsedInput.email,
      organisationName: organisation.name,
      invitedByEmail: session.user.email,
      invitedByName: session.user.name,
      inviteLink: `${getBaseUrl()}${Routes.InvitationRequest}/${invitation.token}`
    });

    await prisma.invitation.update({
      where: {
        id: invitation.id,
        organisationId: session.user.organisationId
      },
      data: { lastSentAt: new Date() },
      select: {
        id: true // SELECT NONE
      }
    });
  });
