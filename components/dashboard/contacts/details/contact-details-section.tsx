'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { ContactRecord } from '@prisma/client';
import { IdCardIcon } from '@radix-ui/react-icons';
import {
  LayoutListIcon,
  MailIcon,
  PhoneIcon,
  SquareDashedKanbanIcon,
  TrashIcon,
  UploadIcon
} from 'lucide-react';
import { FormProvider, type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { updateContactImage } from '@/actions/contacts/update-contact-image';
import { updateContactProperties } from '@/actions/contacts/update-contact-properties';
import { CropPhotoModal } from '@/components/dashboard/settings/account/profile/crop-photo-modal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { contactRecordLabel } from '@/constants/labels';
import { MAX_IMAGE_SIZE } from '@/constants/limits';
import { useZodForm } from '@/hooks/use-zod-form';
import { cn } from '@/lib/utils';
import {
  updateContactPropertiesSchema,
  type UpdateContactPropertiesSchema
} from '@/schemas/contacts/update-contact-properties-schema';
import type { ContactDto } from '@/types/dtos/contact-dto';
import { FileUploadAction } from '@/types/file-upload-action';

export type ContactDetailsSectionProps =
  React.HtmlHTMLAttributes<HTMLDivElement> & {
    contact: ContactDto;
  };

export function ContactDetailsSection({
  contact,
  ...others
}: ContactDetailsSectionProps): React.JSX.Element {
  return (
    <section {...others}>
      <ContactImage {...contact} />
      <Properties {...contact} />
    </section>
  );
}

function ContactImage(contact: ContactDto): React.JSX.Element {
  const handleDrop = async (files: File[]): Promise<void> => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error("Uploaded image shouldn't exceed 5mb size limit");
      } else {
        const base64Image: string = await NiceModal.show(CropPhotoModal, {
          file,
          aspectRatio: 1,
          circularCrop: contact.record === ContactRecord.PERSON
        });
        if (base64Image) {
          const result = await updateContactImage({
            id: contact.id,
            action: FileUploadAction.Update,
            image: base64Image
          });
          if (!result?.serverError && !result?.validationErrors) {
            toast.success('Image updated');
          } else {
            toast.error("Couldn't update image");
          }
        }
      }
    }
  };
  const handleRemoveImage = async (): Promise<void> => {
    const result = await updateContactImage({
      id: contact.id,
      action: FileUploadAction.Delete,
      image: undefined
    });
    if (!result?.serverError && !result?.validationErrors) {
      toast.success('Image removed');
    } else {
      toast.error("Couldn't remove image");
    }
  };
  return (
    <div className="flex items-center justify-center p-6">
      <div className="relative">
        <ImageDropzone
          accept={{ 'image/*': [] }}
          multiple={false}
          onDrop={handleDrop}
          borderRadius={contact.record === ContactRecord.PERSON ? 'full' : 'md'}
          src={contact.image}
          className="max-h-[120px] min-h-[120px] w-[120px] p-0.5"
        >
          <Avatar
            className={cn(
              'size-28',
              contact.record === ContactRecord.PERSON
                ? 'rounded-full'
                : 'rounded-md'
            )}
          >
            <AvatarFallback
              className={cn(
                'size-28 text-2xl',
                contact.record === ContactRecord.PERSON
                  ? 'rounded-full'
                  : 'rounded-md'
              )}
            >
              <UploadIcon className="size-5 shrink-0 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
        </ImageDropzone>
        {contact.image && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute -bottom-1 -right-1 z-10 size-8 rounded-full bg-background"
                onClick={handleRemoveImage}
              >
                <TrashIcon className="size-4 shrink-0" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Remove image</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

function Properties(contact: ContactDto): React.JSX.Element {
  const [editMode, setEditMode] = React.useState<boolean>(false);
  const methods = useZodForm({
    schema: updateContactPropertiesSchema,
    mode: 'onSubmit',
    defaultValues: {
      id: contact.id,
      record: contact.record,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      address: contact.address,
      salutation: contact.salutation,
      firstName: contact.firstName,
      lastName: contact.lastName,
      companyName: contact.companyName,
      companyRegistrationNumber: contact.companyRegistrationNumber,
      phone1: contact.phone1,
      phone2: contact.phone2,
      archived: contact.archived
    }
  });
  const canSubmit = !methods.formState.isSubmitting;
  const handleEnableEditMode = async (): Promise<void> => {
    setEditMode(true);
  };
  const handleCancel = async (): Promise<void> => {
    methods.reset(methods.formState.defaultValues);
    setEditMode(false);
  };
  const onSubmit: SubmitHandler<UpdateContactPropertiesSchema> = async (
    values
  ) => {
    if (!canSubmit) {
      return;
    }
    const result = await updateContactProperties(values);
    if (!result?.serverError && !result?.validationErrors) {
      toast.success('Properties updated');
      setEditMode(false);
    } else {
      toast.error("Couldn't update properties");
    }
  };
  const salutations = ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Prof', 'Master'];
  return (
    <FormProvider {...methods}>
      <form
        className="space-y-2 px-6 pb-6"
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight">Properties</h3>
          {contact.archived ? (
            <span className="text-muted-foreground">Archived</span>
          ) : editMode ? (
            <div>
              <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-success hover:text-success min-w-fit"
          onClick={handleCancel}
              >
          Cancel
              </Button>
              <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-success hover:text-success min-w-fit"
          disabled={!canSubmit}
          onClick={methods.handleSubmit(onSubmit)}
              >
          Save
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-success hover:text-success min-w-fit"
              disabled={methods.formState.isSubmitting}
              onClick={handleEnableEditMode}
            >
              Edit
            </Button>
          )}
        </div>
        <dl className="space-y-1 text-sm">
          <Property
            icon={<SquareDashedKanbanIcon className="size-3 shrink-0" />}
            term="Record"
            details={
              editMode ? (
                <FormField
                  control={methods.control}
                  name="record"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col space-y-1">
                      <FormControl>
                        <Select
                          required
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={methods.formState.isSubmitting}
                        >
                          <SelectTrigger className="h-7 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(ContactRecord).map((value) => (
                              <SelectItem
                                key={value}
                                value={value}
                              >
                                {contactRecordLabel[value as ContactRecord]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              ) : (
                contactRecordLabel[contact.record]
              )
            }
            placeholder="No type available"
          />
         
          {methods.watch('record') === ContactRecord.PERSON && (
            <>
              <Property
                icon={<IdCardIcon className="size-3 shrink-0" />}
                term="Salutation"
                details={
                  editMode ? (
                    <FormField
                      control={methods.control}
                      name="salutation"
                      render={({ field }) => (
                        <FormItem className="flex w-full flex-col space-y-1">
                          <FormControl>
                            <Select
                              required
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={methods.formState.isSubmitting}
                            >
                              <SelectTrigger className="h-7 w-full">
                                <SelectValue placeholder="Select Salutation" />
                              </SelectTrigger>
                              <SelectContent>
                                {salutations.map((salutation) => (
                                  <SelectItem key={salutation} value={salutation}>
                                    {salutation}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  ) : (
                    contact.salutation
                  )
                }
                placeholder="No salutation available"
              />
              <Property
                icon={<IdCardIcon className="size-3 shrink-0" />}
                term="First Name *"
                details={
                  editMode ? (
                    <FormField
                      control={methods.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem className="flex w-full flex-col space-y-1">
                          <FormControl>
                            <Input
                              type="text"
                              maxLength={70}
                              required
                              className="h-7"
                              disabled={methods.formState.isSubmitting}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  ) : (
                    contact.firstName
                  )
                }
                placeholder="First name is required"
              />
              <Property
                icon={<IdCardIcon className="size-3 shrink-0" />}
                term="Last Name *"
                details={
                  editMode ? (
                    <FormField
                      control={methods.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem className="flex w-full flex-col space-y-1">
                          <FormControl>
                            <Input
                              type="text"
                              maxLength={70}
                              required
                              className="h-7"
                              disabled={methods.formState.isSubmitting}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  ) : (
                    contact.lastName
                  )
                }
                placeholder="No last name available"
              />
               <Property
                icon={<IdCardIcon className="size-3 shrink-0" />}
                term="Co. Name"
                details={
                  editMode ? (
                    <FormField
                      control={methods.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem className="flex w-full flex-col space-y-1">
                          <FormControl>
                            <Input
                              type="text"
                              maxLength={70}
                              required
                              className="h-7"
                              disabled={methods.formState.isSubmitting}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  ) : (
                    contact.companyName
                  )
                }
                placeholder="No company name available"
              />
            </>
          )}
          {methods.watch('record') === ContactRecord.COMPANY && (
            <>
              <Property
                icon={<IdCardIcon className="size-3 shrink-0" />}
                term="Co. Name *"
                details={
                  editMode ? (
                    <FormField
                      control={methods.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem className="flex w-full flex-col space-y-1">
                          <FormControl>
                            <Input
                              type="text"
                              maxLength={70}
                              required
                              className="h-7"
                              disabled={methods.formState.isSubmitting}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  ) : (
                    contact.companyName
                  )
                }
                placeholder="Company name is required"
              />
              <Property
                icon={<IdCardIcon className="size-3 shrink-0" />}
                term="Reg. #"
                details={
                  editMode ? (
                    <FormField
                      control={methods.control}
                      name="companyRegistrationNumber"
                      render={({ field }) => (
                        <FormItem className="flex w-full flex-col space-y-1">
                          <FormControl>
                            <Input
                              type="text"
                              maxLength={70}
                              required
                              className="h-7"
                              disabled={methods.formState.isSubmitting}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  ) : (
                    contact.companyRegistrationNumber
                  )
                }
                placeholder="No registration number available"
              />
            </>
          )}
          
          <Property
            icon={<MailIcon className="size-3 shrink-0" />}
            term="Email"
            details={
              editMode ? (
                <FormField
                  control={methods.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col space-y-1">
                      <FormControl>
                        <Input
                          type="email"
                          maxLength={255}
                          required
                          className="h-7"
                          disabled={methods.formState.isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              ) : (
                contact.email
              )
            }
            placeholder="No email available"
          />
     
          <Property
            icon={<PhoneIcon className="size-3 shrink-0" />}
            term="Phone 1"
            details={
              editMode ? (
                <FormField
                  control={methods.control}
                  name="phone1"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col space-y-1">
                      <FormControl>
                        <Input
                          type="tel"
                          maxLength={70}
                          required
                          className="h-7"
                          disabled={methods.formState.isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              ) : (
                contact.phone1
              )
            }
            placeholder="No phone1 available"
          />
          <Property
            icon={<PhoneIcon className="size-3 shrink-0" />}
            term="Phone 2"
            details={
              editMode ? (
                <FormField
                  control={methods.control}
                  name="phone2"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col space-y-1">
                      <FormControl>
                        <Input
                          type="tel"
                          maxLength={70}
                          required
                          className="h-7"
                          disabled={methods.formState.isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              ) : (
                contact.phone2
              )
            }
            placeholder="No phone2 available"
          />
          <Property
            icon={<LayoutListIcon className="size-3 shrink-0" />}
            term="Address"
            details={
              editMode ? (
                <FormField
                  control={methods.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col space-y-1">
                      <FormControl>
                        <Input
                          type="text"
                          maxLength={255}
                          required
                          className="h-7"
                          disabled={methods.formState.isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              ) : (
                contact.address
              )
            }
            placeholder="No address available"
          />
        </dl>
      </form>
    </FormProvider>
  );
}

type PropertyProps = {
  icon: React.ReactNode;
  term: string;
  details?: React.ReactNode;
  placeholder: string;
};

function Property({
  icon,
  term,
  details,
  placeholder
}: PropertyProps): React.JSX.Element {
  return (
    <div className="flex flex-row items-center whitespace-nowrap py-1">
      <dt className="flex min-w-24 flex-row items-center gap-2 text-muted-foreground">
        {icon}
        {term}
      </dt>
      <dd className="flex w-full max-w-[196px] flex-col">
        {details ? (
          details
        ) : (
          <p className="text-muted-foreground opacity-65">{placeholder}</p>
        )}
      </dd>
    </div>
  );
}
