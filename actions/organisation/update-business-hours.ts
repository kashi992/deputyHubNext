'use server';

import { revalidateTag } from 'next/cache';

import { authActionClient } from '@/actions/safe-action';
import { Caching, OrganisationCacheKey } from '@/data/caching';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { updateBusinessHoursSchema } from '@/schemas/organisation/update-business-hours-schema';

export const updateBusinessHours = authActionClient
  .metadata({ actionName: 'updateBusinessHours' })
  .schema(updateBusinessHoursSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organisation = await prisma.organisation.findFirst({
      where: { id: session.user.organisationId },
      select: {
        name: true,
        businessHours: {
          select: {
            id: true,
            dayOfWeek: true,
            timeSlots: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });
    if (!organisation) {
      throw new NotFoundError('Organisation not found');
    }

    await prisma.$transaction([
      prisma.workTimeSlot.deleteMany({
        where: {
          workHours: {
            organisation: {
              id: session.user.organisationId
            }
          },
          workHoursId: {
            in: organisation.businessHours.map((workHours) => workHours.id)
          }
        }
      }),
      ...parsedInput.businessHours.map((workHours) =>
        prisma.workTimeSlot.createMany({
          data: workHours.timeSlots.map((timeSlot) => ({
            workHoursId: organisation.businessHours.find(
              (w) => w.dayOfWeek === workHours.dayOfWeek
            )!.id,
            start: timeSlot.start,
            end: timeSlot.end
          }))
        })
      )
    ]);

    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.BusinessHours,
        session.user.organisationId
      )
    );
  });
