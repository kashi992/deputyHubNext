'use client';

import * as React from 'react';
import { PinIcon } from 'lucide-react';
import { toast } from 'sonner';

import { addPinned } from '@/actions/pinned/add-pinned';
import { removePinned } from '@/actions/pinned/remove-pinned';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ContactDto } from '@/types/dtos/contact-dto';

export type ContactPinnedToggleProps = ButtonProps & {
  contact: ContactDto;
  addedToPinned: boolean;
};

export function ContactPinnedToggle({
  contact,
  addedToPinned,
  className,
  ...other
}: ContactPinnedToggleProps): React.JSX.Element {
  const description = addedToPinned ? 'Unpin' : 'Pin';
  const handleTogglePinned = async (): Promise<void> => {
    if (addedToPinned) {
      const result = await removePinned({ contactId: contact.id });
      if (result?.serverError || result?.validationErrors) {
        toast.error("Couldn't unpin");
      }
    } else {
      const result = await addPinned({ contactId: contact.id });
      if (result?.serverError || result?.validationErrors) {
        toast.error("Couldn't pin");
      }
    }
  };
  return (
    <Button
      type="button"
      variant="ghost"
      title={description}
      onClick={handleTogglePinned}
      className={cn('size-9', className)}
      {...other}
    >
      <PinIcon
        className={cn('size-4 shrink-0', addedToPinned && 'fill-primary')}
      />
      <span className="sr-only">{description}</span>
    </Button>
  );
}
