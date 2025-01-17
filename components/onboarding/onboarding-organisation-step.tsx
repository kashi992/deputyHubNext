'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';

import { NextButton } from '@/components/onboarding/next-button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { type CompleteOrganisationOnboardingSchema } from '@/schemas/onboarding/complete-organisation-onboarding-schema';

export type OnboardingOrganisationStepProps =
  React.HtmlHTMLAttributes<HTMLDivElement> & {
    canSubmit: boolean;
    loading: boolean;
    isLastStep: boolean;
  };

export function OnboardingOrganisationStep({
  canSubmit,
  loading,
  isLastStep,
  className,
  ...other
}: OnboardingOrganisationStepProps): React.JSX.Element {
  const methods = useFormContext<CompleteOrganisationOnboardingSchema>();
  return (
    <div
      className={cn('flex w-full flex-col gap-4', className)}
      {...other}
    >
      <FormField
        control={methods.control}
        name="organisationName"
        render={({ field }) => (
          <FormItem className="flex w-full flex-col">
            <FormLabel required>Organisation name</FormLabel>
            <FormControl>
              <Input
                type="text"
                maxLength={70}
                required
                disabled={loading}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <NextButton
        loading={loading}
        disabled={!canSubmit}
        isLastStep={isLastStep}
      />
    </div>
  );
}
