'use client';

import NiceModal from '@ebay/nice-modal-react';
import { CaretSortIcon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

import { DeleteContactsModal } from '@/components/dashboard/contacts/delete-contacts-modal';
import { ArchiveContactsModal } from '@/components/dashboard/contacts/archive-contacts-modal';
import { Button } from '@/components/ui/button';
import { DataTableBulkActions } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MediaTypeNames } from '@/constants/media-type-names';
import { extractFilenameFromContentDispositionHeader } from '@/lib/browser/content-disposition';
import { getApiUrl } from '@/lib/urls/get-api-url';
import type { ContactDto } from '@/types/dtos/contact-dto';
import { HttpMethod } from '@/types/http-method';

export type ContactsBulkActionsProps = {
  table: Table<ContactDto>;
};
export function ContactsBulkActions({
  table
}: ContactsBulkActionsProps): React.JSX.Element {
  const handleExportSelectedContactsToCsv = async () => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      return;
    }

    const loadingToast = toast.loading('Generating CSV file...');

    try {
      const response = await fetch(`${getApiUrl()}/export/csv/contact-list`, {
        method: HttpMethod.Post,
        headers: {
          'content-type': MediaTypeNames.Application.Json
        },
        body: JSON.stringify({
          ids: selectedRows.map((row) => row.original.id)
        })
      });
      
      if (!response.ok) {
        throw new Error("Couldn't export selected contacts to CSV");
      }

      const data = await response.blob();
      const disposition = response.headers.get('Content-Disposition') ?? '';
      const filename = extractFilenameFromContentDispositionHeader(disposition);

      saveAs(data, filename);
      toast.success('CSV file downloaded successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't export selected contacts to CSV");
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const handleExportSelectedContactsToExcel = async () => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      return;
    }

    const loadingToast = toast.loading('Generating Excel file...');

    try {
      const response = await fetch(`${getApiUrl()}/export/excel/contact-list`, {
        method: HttpMethod.Post,
        headers: {
          'content-type': MediaTypeNames.Application.Json
        },
        body: JSON.stringify({
          ids: selectedRows.map((row) => row.original.id)
        })
      });
      
      if (!response.ok) {
        throw new Error("Couldn't export selected contacts to Excel");
      }

      const data = await response.blob();
      const disposition = response.headers.get('Content-Disposition') ?? '';
      const filename = extractFilenameFromContentDispositionHeader(disposition);

      saveAs(data, filename);
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't export selected contacts to Excel");
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const handleShowArchiveContactsModal = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const isArchived = urlParams.get('archived') === 'true';

    NiceModal.show(ArchiveContactsModal, {
      contacts: selectedRows.map((row) => row.original),
      action: isArchived ? 'unarchive' : 'archive'
    });
  };

  const handleShowDeleteContactsModal = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      return;
    }

    NiceModal.show(DeleteContactsModal, {
      contacts: selectedRows.map((row) => row.original)
    });
  };

  return (
    <DataTableBulkActions table={table}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="default"
            className="text-sm"
          >
            Bulk actions
            <CaretSortIcon className="ml-1 size-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={handleExportSelectedContactsToCsv}>
            Export to CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportSelectedContactsToExcel}>
            Export to Excel
          </DropdownMenuItem>
          <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleShowArchiveContactsModal}>
            {new URLSearchParams(window.location.search).get('archived') === 'true' ? 'Unarchive' : 'Archive'}
            </DropdownMenuItem>
          <DropdownMenuItem
            className="!text-destructive"
            onClick={handleShowDeleteContactsModal}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </DataTableBulkActions>
  );
}
