import { type ContactRecord } from '@prisma/client';

export type VisitedContactDto = {
  id: string;
  firstName: string;
  image?: string;
  record: ContactRecord;
  pageVisits: number;
};
