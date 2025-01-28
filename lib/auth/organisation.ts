import { DayOfWeek, InvitationStatus, Role } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from '@/lib/db/prisma';
import { matchLocale } from '@/lib/i18n/match-locale';
import { createTimeSlot } from '@/lib/utils';

export async function createUserWithOrganisation(input: {
  name: string;
  email: string;
  hashedPassword: string;
  locale?: string;
}): Promise<string> {
  const organisationId = v4();
  const initialName = 'My Organisation';
  const locale = matchLocale(input.locale);

  await prisma.organisation.create({
    data: {
      id: organisationId,
      name: initialName,
      completedOnboarding: false,
      businessHours: createDefaultBusinessHours(),
      users: {
        create: {
          name: input.name,
          email: input.email,
          password: input.hashedPassword,
          role: Role.ADMIN,
          locale,
          completedOnboarding: false
        }
      }
    },
    select: {
      id: true // SELECT NONE
    }
  });

  return organisationId;
}

export async function createOrganisationAndConnectUser(input: {
  userId: string;
  normalizedEmail: string;
}): Promise<string> {
  const organisationId = v4();
  const initialName = 'My Organisation';

  await prisma.$transaction([
    prisma.organisation.create({
      data: {
        id: organisationId,
        name: initialName,
        completedOnboarding: false,
        businessHours: createDefaultBusinessHours(),
        users: {
          connect: {
            id: input.userId
          }
        }
      },
      select: {
        id: true // SELECT NONE
      }
    }),
    prisma.changeEmailRequest.deleteMany({
      where: { email: input.normalizedEmail }
    }),
    prisma.resetPasswordRequest.deleteMany({
      where: { email: input.normalizedEmail }
    }),
    prisma.user.update({
      where: { id: input.userId },
      data: { role: Role.ADMIN },
      select: {
        id: true // SELECT NONE
      }
    })
  ]);

  return organisationId;
}

export async function joinOrganisation(input: {
  invitationId: string;
  organisationId: string;
  name: string;
  normalizedEmail: string;
  hashedPassword: string;
  role: Role;
}): Promise<void> {
  await prisma.$transaction([
    prisma.invitation.updateMany({
      where: { id: input.invitationId },
      data: { status: InvitationStatus.ACCEPTED }
    }),
    prisma.verificationToken.updateMany({
      where: { identifier: input.normalizedEmail },
      data: { expires: new Date(+0) }
    }),
    prisma.changeEmailRequest.deleteMany({
      where: { email: input.normalizedEmail }
    }),
    prisma.resetPasswordRequest.deleteMany({
      where: { email: input.normalizedEmail }
    }),
    prisma.user.create({
      data: {
        organisationId: input.organisationId,
        name: input.name,
        email: input.normalizedEmail,
        password: input.hashedPassword,
        role: input.role,
        locale: 'en-US',
        emailVerified: new Date(),
        completedOnboarding: false
      },
      select: {
        id: true
      }
    })
  ]);
}

function createDefaultBusinessHours() {
  return {
    create: [
      {
        dayOfWeek: DayOfWeek.SUNDAY
      },
      {
        dayOfWeek: DayOfWeek.MONDAY,
        timeSlots: {
          create: {
            start: createTimeSlot(9, 0),
            end: createTimeSlot(17, 0)
          }
        }
      },
      {
        dayOfWeek: DayOfWeek.TUESDAY,
        timeSlots: {
          create: {
            start: createTimeSlot(9, 0),
            end: createTimeSlot(17, 0)
          }
        }
      },
      {
        dayOfWeek: DayOfWeek.WEDNESDAY,
        timeSlots: {
          create: {
            start: createTimeSlot(9, 0),
            end: createTimeSlot(17, 0)
          }
        }
      },
      {
        dayOfWeek: DayOfWeek.THURSDAY,
        timeSlots: {
          create: {
            start: createTimeSlot(9, 0),
            end: createTimeSlot(17, 0)
          }
        }
      },
      {
        dayOfWeek: DayOfWeek.FRIDAY,
        timeSlots: {
          create: {
            start: createTimeSlot(9, 0),
            end: createTimeSlot(17, 0)
          }
        }
      },
      {
        dayOfWeek: DayOfWeek.SATURDAY
      }
    ]
  };
}
