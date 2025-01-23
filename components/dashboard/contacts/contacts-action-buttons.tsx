
'use client';

import * as React from 'react';

import { AddContactButton } from '@/components/dashboard/contacts/add-contact-button';
import { ImportContactsButton } from '@/components/dashboard/contacts/import-contacts-button';

export function ContactsActionButtons(): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <ImportContactsButton />
      <AddContactButton />
    </div>
  );
}