import { z } from 'zod';

export const archiveContactSchema = z.object({
  id: z.string().uuid()
});

export type ArchiveContactSchema = z.infer<typeof archiveContactSchema>;
