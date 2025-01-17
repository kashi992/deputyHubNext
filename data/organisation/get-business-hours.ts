import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  OrganisationCacheKey
} from '@/data/caching';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import type { WorkHoursDto } from '@/types/dtos/work-hours-dto';

export async function getBusinessHours(): Promise<WorkHoursDto[]> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      const organisation = await prisma.organisation.findFirst({
        where: { id: session.user.organisationId },
        select: {
          name: true,
          address: true,
          phone: true,
          email: true,
          businessHours: {
            select: {
              dayOfWeek: true,
              timeSlots: {
                select: {
                  id: true,
                  start: true,
                  end: true
                }
              }
            }
          }
        }
      });
      if (!organisation) {
        throw new NotFoundError('Organisation not found');
      }

      const response: WorkHoursDto[] = organisation.businessHours.map(
        (workHours) => ({
          dayOfWeek: workHours.dayOfWeek,
          timeSlots: workHours.timeSlots.map((timeSlot) => ({
            id: timeSlot.id,
            start: timeSlot.start.toISOString(),
            end: timeSlot.end.toISOString()
          }))
        })
      );

      return response;
    },
    Caching.createOrganisationKeyParts(
      OrganisationCacheKey.BusinessHours,
      session.user.organisationId
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganisationTag(
          OrganisationCacheKey.BusinessHours,
          session.user.organisationId
        )
      ]
    }
  )();
}
