import { ContactRecord } from '@prisma/client';
import { z } from 'zod';

export const updateContactPropertiesSchema = z.object({
  id: z
    .string({
      required_error: 'Id is required.',
      invalid_type_error: 'Id must be a string.'
    })
    .trim()
    .uuid('Id is invalid.')
    .min(1, 'Id is required.')
    .max(36, 'Maximum 36 characters allowed.'),
  record: z.nativeEnum(ContactRecord, {
    required_error: 'Record is required',
    invalid_type_error: 'Record must be a string'
  }),
  email: z
    .string({
      invalid_type_error: 'Email must be a string.'
    })
    .trim()
    .max(255, 'Maximum 255 characters allowed.')
    .email('Enter a valid email address.')
    .optional()
    .or(z.literal('')),
  phone: z
    .string({
      invalid_type_error: 'Phone must be a string.'
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
    .max(255, 'Maximum 255 characters allowed.')
    .optional()
    .or(z.literal('')),
  salutation: z
    .string({
      invalid_type_error: 'Salutation must be a string.'
    })
    .trim()
    .max(10, 'Maximum 10 characters allowed.')
    .optional()
    .or(z.literal('')),
  firstName: z
    .string({
      invalid_type_error: 'First name must be a string.'
    })
    .trim()
    .max(70, 'Maximum 70 characters allowed.')
    .optional()
    .or(z.literal('')),
  lastName: z
    .string({
      invalid_type_error: 'Last name must be a string.'
    })
    .trim()
    .max(70, 'Maximum 70 characters allowed.')
    .optional()
    .or(z.literal('')),
  companyName: z
    .string({
      invalid_type_error: 'Company name must be a string.'
    })
    .trim()
    .max(70, 'Maximum 70 characters allowed.')
    .optional()
    .or(z.literal('')),
  companyRegistrationNumber: z
    .string({
      invalid_type_error: 'Company registration number must be a string.'
    })
    .trim()
    .max(70, 'Maximum 70 characters allowed.')
    .optional()
    .or(z.literal('')),
  phone1: z
    .string({
      invalid_type_error: 'Phone1 must be a string.'
    })
    .trim()
    .max(70, 'Maximum 70 characters allowed.')
    .optional()
    .or(z.literal('')),
  phone2: z
    .string({
      invalid_type_error: 'Phone2 must be a string.'
    })
    .trim()
    .max(70, 'Maximum 70 characters allowed.')
    .optional()
    .or(z.literal(''))
});

export type UpdateContactPropertiesSchema = z.infer<
  typeof updateContactPropertiesSchema
>;
