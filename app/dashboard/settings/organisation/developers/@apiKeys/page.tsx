import * as React from 'react';

import { ApiKeysCard } from '@/components/dashboard/settings/organisation/developers/api-keys-card';
import { getApiKeys } from '@/data/api-keys/get-api-keys';

export default async function ApiKeysPage(): Promise<React.JSX.Element> {
  const apiKeys = await getApiKeys();
  return <ApiKeysCard apiKeys={apiKeys} />;
}
