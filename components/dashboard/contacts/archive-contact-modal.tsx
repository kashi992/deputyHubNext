'use client';

import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { archiveContact } from '@/actions/contacts/archive-contact';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';
import { FormProvider } from '@/components/ui/form';
import { MediaQueries } from '@/constants/media-queries';
import { useEnhancedModal } from '@/hooks/use-enhanced-modal';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useZodForm } from '@/hooks/use-zod-form';
import {
  archiveContactSchema,
  type ArchiveContactSchema
} from '@/schemas/contacts/archive-contact-schema';
import type { ContactDto } from '@/types/dtos/contact-dto';

export type ArchiveContactModalProps = NiceModalHocProps & {
  contact: ContactDto;
  action: 'archive' | 'unarchive';
};

export const ArchiveContactModal = NiceModal.create<ArchiveContactModalProps>(
  ({ contact, action }) => {
    const modal = useEnhancedModal();
    const mdUp = useMediaQuery(MediaQueries.MdUp, { ssr: false });
    const methods = useZodForm({
      schema: archiveContactSchema,
      mode: 'all',
      defaultValues: {
        id: contact.id,
        action
      }
    });

    const isArchive = action === 'archive';
    const title = `${isArchive ? 'Archive' : 'Unarchive'} this contact?`;
    const canSubmit = !methods.formState.isSubmitting && methods.formState.isValid;

    const onSubmit: SubmitHandler<ArchiveContactSchema> = async (values) => {
      if (!canSubmit) return;
      
      const result = await archiveContact(values);
      if (!result?.serverError && !result?.validationErrors) {
        toast.success(`Contact ${isArchive ? 'archived' : 'unarchived'}`);
        modal.resolve(true);
        modal.handleClose();
      } else {
        toast.error(`Contact couldn't be ${isArchive ? 'archived' : 'unarchived'}`);
      }
    };

    const renderDescription = (
      <>
        The contact <strong>{contact.firstName}</strong> will be {isArchive ? 'archived' : 'unarchived'},
        are you sure you want to continue?
      </>
    );

    const renderForm = (
      <form
        className="hidden"
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        <input
          type="hidden"
          className="hidden"
          {...methods.register('id')}
        />
      </form>
    );

    const renderButtons = (
      <>
        <Button
          type="button"
          variant="outline"
          onClick={modal.handleClose}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!canSubmit}
          loading={methods.formState.isSubmitting}
          onClick={methods.handleSubmit(onSubmit)}
        >
          Yes, {isArchive ? 'archive' : 'unarchive'}
        </Button>
      </>
    );

    return (
      <FormProvider {...methods}>
        {mdUp ? (
          <AlertDialog open={modal.visible}>
            <AlertDialogContent
              className="max-w-sm"
              onClose={modal.handleClose}
              onAnimationEndCapture={modal.handleAnimationEndCapture}
            >
              <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {renderDescription}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {renderForm}
              <AlertDialogFooter>{renderButtons}</AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Drawer
            open={modal.visible}
            onOpenChange={modal.handleOpenChange}
          >
            <DrawerContent>
              <DrawerHeader className="text-left">
                <DrawerTitle>{title}</DrawerTitle>
                <DrawerDescription>{renderDescription}</DrawerDescription>
              </DrawerHeader>
              {renderForm}
              <DrawerFooter className="flex-col-reverse pt-4">
                {renderButtons}
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        )}
      </FormProvider>
    );
  }
);
