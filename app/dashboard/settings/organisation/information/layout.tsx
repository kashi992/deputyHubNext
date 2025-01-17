import * as React from 'react';
import { type Metadata } from 'next';

import { AnnotatedLayout } from '@/components/ui/annotated';
import {
  Page,
  PageBody,
  PageHeader,
  PagePrimaryBar,
  PageTitle
} from '@/components/ui/page';
import { Separator } from '@/components/ui/separator';
import { createTitle } from '@/lib/utils';

export const metadata: Metadata = {
  title: createTitle('Organisation information')
};

export type OrganisationInformationLayoutProps = {
  organisationDetails: React.ReactNode;
  businessHours: React.ReactNode;
};

export default function OrganisationInformationLayout({
  organisationDetails,
  businessHours
}: OrganisationInformationLayoutProps): React.JSX.Element {
  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <PageTitle>Organisation information</PageTitle>
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <AnnotatedLayout>
          {organisationDetails}
          <Separator />
          {businessHours}
        </AnnotatedLayout>
      </PageBody>
    </Page>
  );
}
