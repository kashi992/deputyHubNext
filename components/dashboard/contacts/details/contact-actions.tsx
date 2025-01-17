import * as React from 'react';

import { ContactActionsDropdown } from '@/components/dashboard/contacts/details/contact-actions-dropdown';
import { ContactPinnedToggle } from '@/components/dashboard/contacts/details/contact-pinned-toggle';
import { getContactIsInPinned } from '@/data/contacts/get-contact-is-in-pinned';
import type { ContactDto } from '@/types/dtos/contact-dto';

export type ContactActionsProps = React.HtmlHTMLAttributes<HTMLDivElement> & {
  contact: ContactDto;
};

export async function ContactActions({
  contact
}: ContactActionsProps): Promise<React.JSX.Element> {
  const addedToPinned = await getContactIsInPinned({
    contactId: contact.id
  });

  return (
    <div className="flex flex-row items-center gap-2">
      <ContactPinnedToggle
        contact={contact}
        addedToPinned={addedToPinned}
      />
      <ContactActionsDropdown
        contact={contact}
        addedToPinned={addedToPinned}
      />
    </div>
  );
}
