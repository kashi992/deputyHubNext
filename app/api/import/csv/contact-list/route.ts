import { NextRequest, NextResponse } from 'next/server';
import { Prisma, ContactRecord, ContactStage } from '@prisma/client';
import { z } from 'zod';

import { dedupedAuth } from '@/lib/auth';
import { checkSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { ContactSalutation } from '@/types/contact-salutation';
import { Caching, OrganisationCacheKey, UserCacheKey } from '@/data/caching';

// Validation schema for import data
const importSchema = z.object({
    mappings: z.record(z.string()),
    data: z.array(z.record(z.string()))
});

const validateContact = (
    row: Record<string, string>,
    mappings: Record<string, string>,
    index: number
): { isValid: boolean; error?: string } => {
    // Validate salutation if provided
    const salutation = row[mappings.salutation]?.trim();
    if (salutation && !Object.values(ContactSalutation).includes(salutation as ContactSalutation)) {
        return {
            isValid: false,
            error: `Invalid salutation "${salutation}". Must be one of: ${Object.values(ContactSalutation).join(', ')}`
        };
    }

    const recordType = (row[mappings.record] || 'PERSON').toUpperCase() as ContactRecord;

    if (recordType === 'PERSON') {
        if (!row[mappings.firstName]?.trim()) {
            return {
                isValid: false,
                error: 'First name is required for person records'
            };
        }
        if (!row[mappings.lastName]?.trim()) {
            return {
                isValid: false,
                error: 'Last name is required for person records'
            };
        }
    } else if (recordType === 'COMPANY') {
        if (!row[mappings.companyName]?.trim()) {
            return {
                isValid: false,
                error: 'Company name is required for company records'
            };
        }
    } else {
        return {
            isValid: false,
            error: 'Invalid record type. Must be either "PERSON" or "COMPANY"'
        };
    }

    return { isValid: true };
};

const isRowEmpty = (row: Record<string, string>) => {
    return Object.values(row).every(value => !value || value.trim() === '');
};

export async function POST(req: NextRequest): Promise<NextResponse> {
    const session = await dedupedAuth();
    if (!checkSession(session)) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const body = await req.json();
        const validated = importSchema.parse(body);

        // Filter out empty rows before processing
        const nonEmptyData = validated.data.filter(row => !isRowEmpty(row));

        const results = {
            success: 0,
            skipped: 0,
            errors: [] as Array<{ row: number; error: string; rowData?: Record<string, string> }>
        };

        await prisma.$transaction(async (tx) => {
            for (const [index, row] of nonEmptyData.entries()) {
                // Validate row data
                const validation = validateContact(row, validated.mappings, index);
                if (!validation.isValid) {
                    results.errors.push({
                        row: index + 1,
                        error: validation.error || 'Invalid data',
                        rowData: row // Include the raw row data in the error
                    });
                    results.skipped++;
                    continue;
                }

                try {
                    const recordType = (row[validated.mappings.record] || 'PERSON').toUpperCase() as ContactRecord;

                    await tx.contact.create({
                        data: {
                            organisationId: session.user.organisationId,
                            record: recordType,
                            salutation: row[validated.mappings.salutation]?.trim() as ContactSalutation || null,
                            firstName: recordType === 'PERSON' ? row[validated.mappings.firstName]?.trim() : null,
                            lastName: recordType === 'PERSON' ? row[validated.mappings.lastName]?.trim() : null,
                            companyName: recordType === 'COMPANY' ? row[validated.mappings.companyName]?.trim() : null,
                            email: row[validated.mappings.email]?.trim(),
                            phone1: row[validated.mappings.phone1]?.trim(),
                            phone2: row[validated.mappings.phone2]?.trim(),
                            address: row[validated.mappings.address]?.trim(),
                            companyRegistrationNumber: row[validated.mappings.companyRegistrationNumber]?.trim(),
                            stage: ((row[validated.mappings.stage]?.toUpperCase() || 'LEAD') as ContactStage)
                        }
                    });
                    results.success++;
                } catch (error) {
                    results.errors.push({
                        row: index + 1,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        rowData: row // Include the raw row data in the error
                    });
                    results.skipped++;
                }
            }
        });

        // Revalidate the contacts page
        revalidatePath('/contacts');
        
        revalidateTag(
            Caching.createOrganisationTag(
                OrganisationCacheKey.Contacts,
                session.user.organisationId
            )
        );

        revalidateTag(
            Caching.createUserTag(UserCacheKey.Pinned, session.user.id)
        );

        return NextResponse.json({
            ...results,
            message: `Successfully imported ${results.success} contacts. Skipped ${results.skipped} invalid entries.`
        });
    } catch (error) {
        return new NextResponse(
            JSON.stringify({ error: 'Invalid import data' }),
            { status: 400 }
        );
    }
}
