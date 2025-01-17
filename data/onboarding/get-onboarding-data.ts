import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  UserCacheKey
} from '@/data/caching';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError } from '@/lib/validation/exceptions';

type Organisation = {
  name: string;
  completedOnboarding: boolean;
};

type User = {
  name: string;
  email?: string;
  image?: string;
  completedOnboarding: boolean;
};

type OnboardingData = {
  organisation: Organisation;
  user: User;
};

export async function getOnboardingData(): Promise<OnboardingData> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  return cache(
    async () => {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          organisationId: true,
          image: true,
          name: true,
          email: true,
          completedOnboarding: true
        }
      });
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const organisation = await prisma.organisation.findFirst({
        where: { id: session.user.organisationId },
        select: {
          name: true,
          completedOnboarding: true
        }
      });
      if (!organisation) {
        throw new NotFoundError('Organisation not found');
      }

      return {
        organisation: {
          name: organisation.name,
          completedOnboarding: organisation.completedOnboarding
        },
        user: {
          name: user.name,
          email: user.email ?? undefined,
          image: user.image ?? undefined,
          completedOnboarding: user.completedOnboarding
        }
      };
    },
    Caching.createUserKeyParts(UserCacheKey.OnboardingData, session.user.id),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createUserTag(UserCacheKey.OnboardingData, session.user.id)
      ]
    }
  )();
}
