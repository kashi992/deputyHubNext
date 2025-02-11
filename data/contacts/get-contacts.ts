import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { redirect } from 'next/navigation';
import { ContactRecord, Prisma } from '@prisma/client';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  OrganisationCacheKey
} from '@/data/caching';
import { dedupedAuth } from '@/lib/auth';
import { getLoginRedirect } from '@/lib/auth/redirect';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { ValidationError } from '@/lib/validation/exceptions';
import {
  getContactsSchema,
  RecordsOption,
  type GetContactsSchema
} from '@/schemas/contacts/get-contacts-schema';
import type { ContactDto } from '@/types/dtos/contact-dto';

export async function getContacts(input: GetContactsSchema): Promise<{
  contacts: ContactDto[];
  filteredCount: number;
  totalCount: number;
}> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return redirect(getLoginRedirect());
  }

  const result = getContactsSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(JSON.stringify(result.error.flatten()));
  }
  const parsedInput = result.data;

  const searchCriteria: Prisma.StringFilter | undefined =
    parsedInput.searchQuery
      ? { contains: parsedInput.searchQuery, mode: 'insensitive' }
      : undefined;
  const searchVector = searchCriteria
    ? [{ firstName: searchCriteria },
    { lastName: searchCriteria },
    { companyName: searchCriteria },
    { phone1: searchCriteria },
    { email: searchCriteria }]
    : undefined;

  return cache(
    async () => {
      const [contacts, filteredCount, totalCount] = await prisma.$transaction([
        prisma.contact.findMany({
          skip: parsedInput.pageIndex * parsedInput.pageSize,
          take: parsedInput.pageSize,
          where: {
            organisationId: session.user.organisationId,
            record: mapRecords(parsedInput.records),
            archived: parsedInput.archived,
            tags:
              parsedInput.tags && parsedInput.tags.length > 0
                ? { some: { text: { in: parsedInput.tags } } }
                : undefined,
            OR: searchVector
          },
          select: {
            id: true,
            organisationId: true,
            record: true,
            image: true,
            name: true,
            email: true,
            address: true,
            phone: true,
            stage: true,
            salutation: true,
            firstName: true,
            lastName: true,
            companyName: true,
            phone1: true,
            phone2: true,
            companyRegistrationNumber: true,
            createdAt: true,
            updatedAt: true,
            archived: true,
            tags: {
              select: {
                id: true,
                text: true
              }
            },
            pinned: true,
            tasks: true,
            media: true
          },
          orderBy: {
            [parsedInput.sortBy]: parsedInput.sortDirection
          }
        }),
        prisma.contact.count({
          where: {
            organisationId: session.user.organisationId,
            record: mapRecords(parsedInput.records),
            archived: parsedInput.archived,
            tags:
              parsedInput.tags && parsedInput.tags.length > 0
                ? { some: { text: { in: parsedInput.tags } } }
                : undefined,
            OR: searchVector
          }
        }),
        prisma.contact.count({
          where: {
            organisationId: session.user.organisationId,
            archived: parsedInput.archived
          }
        })
      ]);

      const mapped: ContactDto[] = contacts.map((contact) => ({
        id: contact.id,
        organisationId: contact.organisationId,
        record: contact.record,
        image: contact.image ? contact.image : undefined,
        name: contact.firstName,
        email: contact.email ? contact.email : undefined,
        address: contact.address ? contact.address : undefined,
        phone: contact.phone ? contact.phone : undefined,
        stage: contact.stage ?? undefined,
        salutation: contact.salutation ?? undefined,
        firstName: contact.firstName ?? undefined,
        lastName: contact.lastName ?? undefined,
        companyName: contact.companyName ?? undefined,
        phone1: contact.phone1 ?? undefined,
        phone2: contact.phone2 ?? undefined,
        companyRegistrationNumber: contact.companyRegistrationNumber ?? undefined,
        createdAt: contact.createdAt ?? undefined,
        updatedAt: contact.updatedAt ?? undefined,
        archived: contact.archived ?? undefined,
        tags: contact.tags ?? undefined,
        pinned: contact.pinned ?? undefined,
        tasks: contact.tasks ?? undefined,
        media: contact.media ?? undefined,
      }));

      return { contacts: mapped, filteredCount, totalCount };
    },
    Caching.createOrganisationKeyParts(
      OrganisationCacheKey.Contacts,
      session.user.organisationId,
      parsedInput.pageIndex.toString(),
      parsedInput.pageSize.toString(),
      parsedInput.sortBy,
      parsedInput.sortDirection,
      parsedInput.tags.join(','),
      parsedInput.records?.toString() ?? '',
      parsedInput.searchQuery?.toString() ?? '',
      parsedInput.archived?.toString() ?? 'false' // Add archived to cache key
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganisationTag(
          OrganisationCacheKey.Contacts,
          session.user.organisationId
        )
      ]
    }
  )();
}

function mapRecords(option: RecordsOption): ContactRecord | undefined {
  switch (option) {
    case RecordsOption.People:
      return ContactRecord.PERSON;
    case RecordsOption.Companies:
      return ContactRecord.COMPANY;
  }

  return undefined;
}
