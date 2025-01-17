'use server';

import { createHash } from 'crypto';
import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { authActionClient } from '@/actions/safe-action';
import { Routes } from '@/constants/routes';
import { Caching, OrganisationCacheKey, UserCacheKey } from '@/data/caching';
import { addExampleData } from '@/lib/db/example-data';
import { prisma } from '@/lib/db/prisma';
import { decodeBase64Image } from '@/lib/imaging/decode-base64-image';
import { resizeImage } from '@/lib/imaging/resize-image';
import { getUserImageUrl } from '@/lib/urls/get-user-image-url';
import { NotFoundError } from '@/lib/validation/exceptions';
import { completeOnboardingSchema } from '@/schemas/onboarding/complete-onboarding-schema';
import { FileUploadAction } from '@/types/file-upload-action';
import type { Maybe } from '@/types/maybe';

export const completeOnboarding = authActionClient
  .metadata({ actionName: 'completeOnboarding' })
  .schema(completeOnboardingSchema)
  .action(async ({ parsedInput, ctx: { session } }) => {
    const organisation = await prisma.organisation.findFirst({
      where: { id: session.user.organisationId },
      select: {
        completedOnboarding: true
      }
    });
    if (!organisation) {
      throw new NotFoundError('Organisation not found');
    }
    if (organisation.completedOnboarding) {
      return redirect(Routes.Dashboard);
    }
    const userFromDb = await prisma.user.findFirst({
      where: { id: session.user.id },
      select: { completedOnboarding: true }
    });
    if (!userFromDb) {
      throw new NotFoundError('User not found');
    }
    if (userFromDb.completedOnboarding) {
      return redirect(Routes.Dashboard);
    }

    const transactions = [];
    let imageUrl: Maybe<string> = undefined;

    if (parsedInput.action === FileUploadAction.Update && parsedInput.image) {
      const { buffer, mimeType } = decodeBase64Image(parsedInput.image);
      const data = await resizeImage(buffer, mimeType);
      const hash = createHash('sha256').update(data).digest('hex');

      transactions.push(
        prisma.userImage.deleteMany({
          where: { userId: session.user.id }
        })
      );

      transactions.push(
        prisma.userImage.create({
          data: {
            userId: session.user.id,
            data,
            contentType: mimeType,
            hash
          }
        })
      );

      imageUrl = getUserImageUrl(session.user.id, hash);
    }
    if (parsedInput.action === FileUploadAction.Delete) {
      transactions.push(
        prisma.userImage.deleteMany({
          where: { userId: session.user.id }
        })
      );

      imageUrl = null;
    }

    transactions.push(
      prisma.organisation.update({
        where: { id: session.user.organisationId },
        data: {
          name: parsedInput.organisationName,
          completedOnboarding: true
        },
        select: {
          id: true // SELECT NONE
        }
      })
    );

    transactions.push(
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          image: imageUrl,
          name: parsedInput.name,
          phone: parsedInput.phone,
          completedOnboarding: true
        },
        select: {
          id: true // SELECT NONE
        }
      })
    );

    await prisma.$transaction(transactions);

    try {
      await addExampleData(session.user.organisationId, session.user.id);
    } catch (e) {
      console.error(e);
    }

    revalidateTag(
      Caching.createUserTag(UserCacheKey.OnboardingData, session.user.id)
    );
    revalidateTag(
      Caching.createUserTag(UserCacheKey.PersonalDetails, session.user.id)
    );
    revalidateTag(
      Caching.createUserTag(UserCacheKey.Preferences, session.user.id)
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
