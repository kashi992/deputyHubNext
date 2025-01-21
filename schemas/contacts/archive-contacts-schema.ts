import { z } from 'zod';

export const archiveContactsSchema = z.object({
  ids: z.array(z.string().uuid()),
  action: z.enum(['archive', 'unarchive'])
});

export type ArchiveContactsSchema = z.infer<typeof archiveContactsSchema>;
