import { z } from 'zod';

export const archiveContactSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['archive', 'unarchive'])
});

export type ArchiveContactSchema = z.infer<typeof archiveContactSchema>;
