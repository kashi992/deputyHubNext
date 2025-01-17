'use server';

import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { authActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { Caching, OrganisationCacheKey, UserCacheKey } from '@/data/caching';
import { addExampleData } from '@/lib/db/example-data';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';
import { completeOrganisationOnboardingSchema } from '@/schemas/onboarding/complete-organisation-onboarding-schema';

export const completeOrganisationOnlyOnboarding = authActionClient
  .metadata({ actionName: 'completeOrganisationOnlyOnboarding' })
  .schema(completeOrganisationOnboardingSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organisation = await prisma.organisation.findFirst({
      where: { id: session.user.organisationId },
      select: {
        completedOnboarding: true
      }
    });
    if (!organisation) {
      throw new NotFoundError('Organiztion not found');
    }
    if (organisation.completedOnboarding) {
      return redirect(Routes.Dashboard);
    }

    await prisma.organisation.update({
      where: { id: session.user.organisationId },
      data: {
        name: parsedInput.organisationName,
        completedOnboarding: true
      },
      select: {
        id: true // SELECT NONE
      }
    });
    
    try {
      await addExampleData(session.user.organisationId, session.user.id);
    } catch (e) {
      console.error(e);
    }

    revalidateTag(
      Caching.createUserTag(UserCacheKey.OnboardingData, session.user.id)
    );
    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.OrganisationDetails,
        session.user.organisationId
      )
    );
    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.LeadGenerationData,
        session.user.organisationId
      )
    );
    revalidateTag(
      Caching.createOrganisationTag(
        OrganisationCacheKey.ContactPageVisits,
        session.user.organisationId
      )
    );

    return redirect(Routes.Home);
  });
