'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganisationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { updateContactTaskSchema } from '@/schemas/contacts/update-contact-task-schema';

export const updateContactTask = authActionClient
  .metadata({ actionName: 'updateContactTask' })
  .schema(updateContactTaskSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const task = await prisma.contactTask.update({
      where: {
        id: parsedInput.id,
        contact: {
          organisationId: session.user.organisationId
        }
      },
      data: {
        title: parsedInput.title,
        description: parsedInput.description,
        status: parsedInput.status,
        dueDate: parsedInput.dueDate ? parsedInput.dueDate : null
      },
      select: { contactId: true }
    });

    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.ContactTasks,
        session.user.organisationId,
        task.contactId
      )
    );
  });
