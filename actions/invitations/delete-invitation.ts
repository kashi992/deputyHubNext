'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganisationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { deleteInvitationSchema } from '@/schemas/invitations/delete-invitation-schema';

export const deleteInvitation = authActionClient
  .metadata({ actionName: 'deleteInvitation' })
  .schema(deleteInvitationSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const count = await prisma.invitation.count({
      where: {
        organisationId: session.user.organisationId,
        id: parsedInput.id
      }
    });
    if (count < 1) {
      throw new NotFoundError('Invitation not found');
    }

    await prisma.invitation.deleteMany({
      where: {
        organisationId: session.user.organisationId,
        id: parsedInput.id
      }
    });

    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.Invitations,
        session.user.organisationId
      )
    );
  });
