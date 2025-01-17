'use server';

import { revalidateTag } from 'next/cache';
import { InvitationStatus } from '@prisma/client';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganisationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { sendRevokedInvitationEmail } from '@/lib/smtp/send-revoked-invitation-email';
import { NotFoundError } from '@/lib/validation/exceptions';
import { revokeInvitationSchema } from '@/schemas/invitations/revoke-invitation-schema';

export const revokeInvitation = authActionClient
  .metadata({ actionName: 'revokeInvitation' })
  .schema(revokeInvitationSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const invitation = await prisma.invitation.findFirst({
      where: {
        organisationId: session.user.organisationId,
        id: parsedInput.id
      },
      select: {
        status: true,
        email: true,
        organisation: {
          select: {
            name: true
          }
        }
      }
    });
    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    await prisma.invitation.updateMany({
      where: {
        organisationId: session.user.organisationId,
        id: parsedInput.id,
        AND: [
          { NOT: { status: { equals: InvitationStatus.ACCEPTED } } },
          { NOT: { status: { equals: InvitationStatus.REVOKED } } }
        ]
      },
      data: {
        status: InvitationStatus.REVOKED
      }
    });

    if (
      invitation.status !== InvitationStatus.REVOKED &&
      invitation.status !== InvitationStatus.ACCEPTED
    ) {
      try {
        await sendRevokedInvitationEmail({
          recipient: invitation.email,
          organisationName: invitation.organisation.name
        });
      } catch (e) {
        console.error(e);
      }
    }

    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.Invitations,
        session.user.organisationId
      )
    );
  });
