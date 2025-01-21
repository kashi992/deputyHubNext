import { type ContactRecord, type ContactStage } from '@prisma/client';

import type { TagDto } from '@/types/dtos/tag-dto';

export type ContactDto = {
  id: string;
  record: ContactRecord;
  image?: string;
  name?: string;
  salutation?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  phone1?: string;
  phone2?: string;
  address?: string;
  companyRegistrationNumber?: string;
  stage: ContactStage;
  createdAt: Date;
  tags: TagDto[];
  archived: boolean;
};
