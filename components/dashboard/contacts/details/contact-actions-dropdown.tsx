'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import NiceModal from '@ebay/nice-modal-react';
import { MoreHorizontalIcon } from 'lucide-react';
import { toast } from 'sonner';

import { addPinned } from '@/actions/pinned/add-pinned';
import { removePinned } from '@/actions/pinned/remove-pinned';
import { DeleteContactModal } from '@/components/dashboard/contacts/delete-contact-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Routes } from '@/constants/routes';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import type { ContactDto } from '@/types/dtos/contact-dto';

export type ContactActionsDropdownProps = {
  contact: ContactDto;
  addedToPinned: boolean;
};

export function ContactActionsDropdown({
  contact,
  addedToPinned
}: ContactActionsDropdownProps): React.JSX.Element {
  const router = useRouter();
  const copyToClipboard = useCopyToClipboard();
  const handleShowDeleteContactModal = async (): Promise<void> => {
    const deleted: boolean = await NiceModal.show(DeleteContactModal, {
      contact
    });
    if (deleted) {
      router.push(Routes.Contacts);
    }
  };
  const handleCopyContactId = async (): Promise<void> => {
    await copyToClipboard(contact.id);
    toast.success('Copied!');
  };
  const handleCopyPageUrl = async (): Promise<void> => {
    await copyToClipboard(window.location.href);
    toast.success('Copied!');
  };
  const handleAddPinned = async (): Promise<void> => {
    const result = await addPinned({ contactId: contact.id });
    if (result?.serverError || result?.validationErrors) {
      toast.error("Couldn't add pinned");
    }
  };
  const handleRemovePinned = async (): Promise<void> => {
    const result = await removePinned({ contactId: contact.id });
    if (result?.serverError || result?.validationErrors) {
      toast.error("Couldn't remove pinned");
    }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="size-9"
          title="Open menu"
        >
          <MoreHorizontalIcon className="size-4 shrink-0" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopyContactId}>
          Copy contact ID
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyPageUrl}>
          Copy page URL
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {addedToPinned ? (
          <DropdownMenuItem onClick={handleRemovePinned}>
            Unpin
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleAddPinned}>Pin</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="!text-destructive"
          onClick={handleShowDeleteContactModal}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
