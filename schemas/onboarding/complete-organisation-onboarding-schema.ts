import { z } from 'zod';

export const completeOrganisationOnboardingSchema = z.object({
  organisationName: z
    .string({
      required_error: 'Organisation name is required.',
      invalid_type_error: 'Organisation name must be a string.'
    })
    .trim()
    .min(1, 'Organisation name is required.')
    .max(255, 'Maximum 255 characters allowed.')
});

export type CompleteOrganisationOnboardingSchema = z.infer<
  typeof completeOrganisationOnboardingSchema
>;
