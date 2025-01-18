import { ContactRecord } from '@prisma/client';
import { z } from 'zod';

export const addContactSchema = z.object({
  record: z.nativeEnum(ContactRecord, {
    required_error: 'Record is required',
    invalid_type_error: 'Record must be a string'
  }),
  salutation: z
    .enum(['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Prof', 'Master'], {
      invalid_type_error: 'Salutation must be one of the predefined options.'
    })
    .optional()
    .or(z.literal('')),
  firstName: z
    .string({
      required_error: 'First Name is required.',
      invalid_type_error: 'First Name must be a string.'
    })
    .trim()
    .max(64, 'Maximum 64 characters allowed.')
    .optional(),
  lastName: z
    .string({
      required_error: 'Last Name is required.',
      invalid_type_error: 'Last Name must be a string.'
    })
    .trim()
    .max(64, 'Maximum 64 characters allowed.')
    .optional(),
  companyName: z
    .string({
      required_error: 'Company Name is required.',
      invalid_type_error: 'Company Name must be a string.'
    })
    .trim()
    .max(64, 'Maximum 64 characters allowed.')
    .optional(),
  email: z
    .string({
      invalid_type_error: 'Email must be a string.'
    })
    .trim()
    .max(255, 'Maximum 255 characters allowed.')
    .email('Enter a valid email address.')
    .optional()
    .or(z.literal('')),
  phone1: z
    .string({
      invalid_type_error: 'Telephone (1) must be a string.'
    })
    .trim()
    .max(16, 'Maximum 16 characters allowed.')
    .optional()
    .or(z.literal('')),
  phone2: z
    .string({
      invalid_type_error: 'Telephone (2) must be a string.'
    })
    .trim()
    .max(16, 'Maximum 16 characters allowed.')
    .optional()
    .or(z.literal('')),
  address: z
    .string({
      invalid_type_error: 'Address must be a string.'
    })
    .trim()
    .optional()
    .or(z.literal('')),
  companyRegistrationNumber: z
    .string({
      invalid_type_error: 'Company Registration Number must be a string.'
    })
    .trim()
    .optional()
    .or(z.literal(''))
})
.superRefine((values, ctx) => {
  if (values.record === ContactRecord.PERSON) {
    if (!values.firstName || !values.firstName.trim()) {
      ctx.addIssue({
        path: ['firstName'],
        code: 'custom',
        message: 'First name is required for person contacts',
      });
    }
    if (!values.lastName || !values.lastName.trim()) {
      ctx.addIssue({
        path: ['lastName'],
        code: 'custom',
        message: 'Last name is required for person contacts',
      });
    }
  }
  if (values.record === ContactRecord.COMPANY) {
    if (!values.companyName || !values.companyName.trim()) {
      ctx.addIssue({
        path: ['companyName'],
        code: 'custom',
        message: 'Company name is required for company contacts',
      });
    }
  }
});

export type AddContactSchema = z.infer<typeof addContactSchema>;
