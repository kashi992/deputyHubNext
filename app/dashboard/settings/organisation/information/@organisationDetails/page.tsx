import * as React from 'react';

import { OrganisationDetailsCard } from '@/components/dashboard/settings/organisation/information/organisation-details-card';
import { getOrganisationDetails } from '@/data/organisation/get-organisation-details';

export default async function OrganisationDetailsPage(): Promise<React.JSX.Element> {
  const details = await getOrganisationDetails();
  return <OrganisationDetailsCard details={details} />;
}
