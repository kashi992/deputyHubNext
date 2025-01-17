'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganisationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { deleteContactTaskSchema } from '@/schemas/contacts/delete-contact-task-schema';

export const deleteContactTask = authActionClient
  .metadata({ actionName: 'deleteContactTask' })
  .schema(deleteContactTaskSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const count = await prisma.contactTask.count({
      where: {
        id: parsedInput.id,
        contact: {
          organisationId: session.user.organisationId
        }
      }
    });
    if (count < 1) {
      throw new NotFoundError('Task not found');
    }

    const deletedTask = await prisma.contactTask.delete({
      where: { id: parsedInput.id },
      select: { contactId: true }
    });

    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.ContactTasks,
        session.user.organisationId,
        deletedTask.contactId
      )
    );
  });
