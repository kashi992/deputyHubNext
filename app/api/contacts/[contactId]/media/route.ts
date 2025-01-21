import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';
import { validate as uuidValidate } from 'uuid';
import path from 'path';
import crypto from 'crypto';
import { writeFile } from 'fs/promises';
import { mkdir } from 'fs/promises';

import { prisma } from '@/lib/db/prisma';
import type { Params } from '@/types/request-params';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const paramsCache = createSearchParamsCache({
  contactId: parseAsString.withDefault('')
});

export async function POST(req: NextRequest, props: { params: Promise<Params> }): Promise<Response> {
  try {
    const { contactId } = await paramsCache.parse(props.params);
    if (!contactId || !uuidValidate(contactId)) {
      return new NextResponse(undefined, { status: 400 });
    }

    // Ensure contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: contactId }
    });
    if (!contact) {
      console.error('Contact not found:', contactId);
      return new NextResponse(undefined, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file || !file.size || !file.type) {
      return new NextResponse(undefined, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return new NextResponse(undefined, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return new NextResponse(undefined, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Create upload directory if it doesn't exist
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const ext = path.extname(file.name);
    const fileName = `${Date.now()}-${hash.substring(0, 8)}${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Save file
    await writeFile(filePath, buffer);

    // Save to database
    const [media] = await prisma.$transaction(
      [
        prisma.contactMedia.create({
          data: {
            contactId,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            fileUrl: `/uploads/${fileName}`
          }
        })
      ],
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
      }
    );

    console.log('Contact media saved:', media);
    return NextResponse.json(media);
  } catch (error) {
    console.error('DB save error:', error);
    return new NextResponse(undefined, { status: 500 });
  }
}

export async function GET(req: NextRequest, props: { params: Promise<Params> }): Promise<Response> {
  try {
    const { contactId } = await paramsCache.parse(props.params);
    if (!contactId || !uuidValidate(contactId)) {
      return new NextResponse(undefined, { status: 400 });
    }

    const [media] = await prisma.$transaction(
      [
        prisma.contactMedia.findMany({
          where: { contactId },
          orderBy: { createdAt: 'desc' }
        })
      ],
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadUncommitted
      }
    );

    return NextResponse.json(media);
  } catch (error) {
    console.error('Error fetching media:', error);
    return new NextResponse(undefined, { status: 500 });
  }
}
