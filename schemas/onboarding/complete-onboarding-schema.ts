import { z } from 'zod';

import { completeOrganisationOnboardingSchema } from '@/schemas/onboarding/complete-organisation-onboarding-schema';
import { completeUserOnboardingSchema } from '@/schemas/onboarding/complete-user-onboarding-schema';

export const completeOnboardingSchema =
  completeOrganisationOnboardingSchema.merge(completeUserOnboardingSchema);

export type CompleteOnboardingSchema = z.infer<typeof completeOnboardingSchema>;
