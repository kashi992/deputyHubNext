'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { UploadIcon } from '@radix-ui/react-icons';

import { ImportContactsModal } from '@/components/dashboard/contacts/import/import-contacts-modal';
import { Button } from '@/components/ui/button';

export function ImportContactsButton(): React.JSX.Element {
  const handleShowImportContactsModal = (): void => {
    NiceModal.show(ImportContactsModal);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="default"
      className="whitespace-nowrap"
      onClick={handleShowImportContactsModal}
    >
      <UploadIcon className="mr-2 size-4" />
      Import contacts
    </Button>
  );
}
