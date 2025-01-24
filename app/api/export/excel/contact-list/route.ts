import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import type { Column } from 'exceljs';
import { Workbook } from 'exceljs';

import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { exportCsvContactListSchema } from '@/schemas/contacts/export-csv-contact-list-schema';

enum ContactColumn {
  Record = 'record',
  Salutation = 'salutation',
  FirstName = 'firstName',
  LastName = 'lastName',
  CompanyName = 'companyName',
  Email = 'email',
  Phone1 = 'phone1',
  Phone2 = 'phone2',
  Address = 'address',
  CompanyRegistrationNumber = 'companyRegistrationNumber',
  Stage = 'stage',
  Tags = 'tags'
}

const columns: Partial<Column>[] = [
  { header: 'Record Type', key: ContactColumn.Record },
  { header: 'Salutation', key: ContactColumn.Salutation },
  { header: 'First Name', key: ContactColumn.FirstName },
  { header: 'Last Name', key: ContactColumn.LastName },
  { header: 'Company Name', key: ContactColumn.CompanyName },
  { header: 'Email', key: ContactColumn.Email },
  { header: 'Primary Phone', key: ContactColumn.Phone1 },
  { header: 'Secondary Phone', key: ContactColumn.Phone2 },
  { header: 'Address', key: ContactColumn.Address },
  { header: 'Company Registration', key: ContactColumn.CompanyRegistrationNumber },
  { header: 'Stage', key: ContactColumn.Stage },
  { header: 'Tags', key: ContactColumn.Tags }
];

type Row = {
  [ContactColumn.Record]: string;
  [ContactColumn.Salutation]: string;
  [ContactColumn.FirstName]: string;
  [ContactColumn.LastName]: string;
  [ContactColumn.CompanyName]: string;
  [ContactColumn.Email]: string;
  [ContactColumn.Phone1]: string;
  [ContactColumn.Phone2]: string;
  [ContactColumn.Address]: string;
  [ContactColumn.CompanyRegistrationNumber]: string;
  [ContactColumn.Stage]: string;
  [ContactColumn.Tags]: string;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await dedupedAuth();
  if (!checkSession(session)) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }

  const body = await req.json();
  const bodyParsingResult = exportCsvContactListSchema.safeParse(body);
  if (!bodyParsingResult.success) {
    return new NextResponse(JSON.stringify(bodyParsingResult.error.flatten()), {
      status: 400,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }
  const parsedBody = bodyParsingResult?.data ?? {};

  const [records] = await prisma.$transaction(
    [
      prisma.contact.findMany({
        where: {
          organisationId: session.user.organisationId,
          id: parsedBody.ids ? { in: parsedBody.ids } : undefined
        },
        select: {
          record: true,
          salutation: true,
          firstName: true,
          lastName: true,
          companyName: true,
          email: true,
          phone1: true,
          phone2: true,
          address: true,
          companyRegistrationNumber: true,
          stage: true,
          tags: {
            select: {
              text: true
            }
          }
        }
      })
    ],
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadUncommitted
    }
  );

  const now = new Date();
  const workbook = new Workbook();
  workbook.creator = 'DeputyHub';
  workbook.lastModifiedBy = 'DeputyHub';
  workbook.created = now;
  workbook.modified = now;
  const sheet = workbook.addWorksheet('Contact List');
  sheet.columns = columns;

  for (const record of records) {
    const row: Row = {
      [ContactColumn.Record]: record.record,
      [ContactColumn.Salutation]: record.salutation ?? '',
      [ContactColumn.FirstName]: record.firstName ?? '',
      [ContactColumn.LastName]: record.lastName ?? '',
      [ContactColumn.CompanyName]: record.companyName ?? '',
      [ContactColumn.Email]: record.email ?? '',
      [ContactColumn.Phone1]: record.phone1 ?? '',
      [ContactColumn.Phone2]: record.phone2 ?? '',
      [ContactColumn.Address]: record.address ?? '',
      [ContactColumn.CompanyRegistrationNumber]: record.companyRegistrationNumber ?? '',
      [ContactColumn.Stage]: record.stage ?? '',
      [ContactColumn.Tags]: record.tags.map((tag) => tag.text).join(',')
    };
    sheet.addRow(row).commit();
  }

  const filename = 'contact-list.xlsx';
  const headers = new Headers();
  headers.append('Cache-Control', 'no-store');
  headers.append(
    'Content-Disposition',
    `attachment; filename=${filename}; filename*=UTF-8''${filename}`
  );
  headers.append(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers
  });
}
