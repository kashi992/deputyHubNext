import { AppInfo } from '@/constants/app-info';

export enum UserCacheKey {
  OnboardingData,
  Pinned,
  ContactIsInPinned,
  Profile,
  PersonalDetails,
  Preferences,
  MultiFactorAuthentication,
  Sessions,
  TransactionalEmails,
  MarketingEmails
}

export enum OrganisationCacheKey {
  LeadGenerationData,
  Contacts,
  ContactTags,
  Contact,
  ContactPageVisits,
  ContactTimelineEvents,
  ContactNotes,
  ContactTasks,
  OrganisationDetails,
  BusinessHours,
  Members,
  Invitations,
  ApiKeys,
  Webhooks
}

export class Caching {
  private static readonly USER_PREFIX = 'user';
  private static readonly ORGANISATION_PREFIX = 'organisation';

  private static joinKeyParts(...parts: string[]): string[] {
    return parts.filter((part) => part.length > 0);
  }

  private static joinTagParts(...parts: string[]): string {
    return parts.filter((part) => part.length > 0).join(':');
  }

  public static createUserKeyParts(
    key: UserCacheKey,
    userId: string,
    ...additionalKeyParts: string[]
  ): string[] {
    if (!userId) {
      throw new Error('User ID cannot be empty');
    }
    return this.joinKeyParts(
      this.USER_PREFIX,
      userId,
      UserCacheKey[key].toLowerCase(),
      ...additionalKeyParts
    );
  }

  public static createUserTag(
    key: UserCacheKey,
    userId: string,
    ...additionalTagParts: string[]
  ): string {
    if (!userId) {
      throw new Error('User ID cannot be empty');
    }
    return this.joinTagParts(
      this.USER_PREFIX,
      userId,
      UserCacheKey[key].toLowerCase(),
      ...additionalTagParts
    );
  }

  public static createOrganisationKeyParts(
    key: OrganisationCacheKey,
    organisationId: string,
    ...additionalKeyParts: string[]
  ): string[] {
    if (!organisationId) {
      throw new Error('Organisation ID cannot be empty');
    }
    return this.joinKeyParts(
      this.ORGANISATION_PREFIX,
      organisationId,
      OrganisationCacheKey[key].toLowerCase(),
      ...additionalKeyParts
    );
  }

  public static createOrganisationTag(
    key: OrganisationCacheKey,
    organisationId: string,
    ...additionalTagParts: string[]
  ): string {
    if (!organisationId) {
      throw new Error('Organisation ID cannot be empty');
    }
    return this.joinTagParts(
      this.ORGANISATION_PREFIX,
      organisationId,
      OrganisationCacheKey[key].toLowerCase(),
      ...additionalTagParts
    );
  }
}

export const defaultRevalidateTimeInSeconds = AppInfo.PRODUCTION ? 3600 : 120;
