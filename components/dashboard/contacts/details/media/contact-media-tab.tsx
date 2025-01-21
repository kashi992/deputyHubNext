'use client';

import * as React from 'react';
import { FileIcon, Upload, Trash2Icon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { ContactDto } from '@/types/dtos/contact-dto';
import type { ContactMedia } from '@prisma/client';

export type ContactMediaTabProps = {
  contact: ContactDto;
};

export function ContactMediaTab({ contact }: ContactMediaTabProps): React.JSX.Element {
  const [media, setMedia] = React.useState<ContactMedia[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);

  const fetchMedia = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/contacts/${contact.id}/media`);
      if (!response.ok) throw new Error('Failed to fetch media');
      const data = await response.json();
      setMedia(data);
    } catch (error) {
      toast.error('Failed to load media');
    }
  }, [contact.id]);

  React.useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/contacts/${contact.id}/media`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }
      }
      toast.success('Files uploaded successfully');
      fetchMedia();
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  }, [contact.id, fetchMedia]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    }
  });

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Card
        {...getRootProps()}
        className="flex cursor-pointer flex-col items-center justify-center gap-4 p-8 text-center"
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-lg font-medium">Drop the files here...</p>
        ) : (
          <>
            <p className="text-lg font-medium">Drag & drop files here, or click to select files</p>
            <p className="text-sm text-muted-foreground">
              Supports PDF, Word, Excel, and image files up to 10MB
            </p>
          </>
        )}
        <Button variant="secondary">Select Files</Button>
      </Card>

      <div className="grid gap-4">
        {media.map((item) => (
          <Card key={item.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <FileIcon className="h-5 w-5" />
              <div>
                <p className="font-medium">{item.fileName}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(item.fileSize)}
                </p>
              </div>
            </div>
            <a
              href={item.fileUrl}
              download={item.fileName}
              className="text-sm text-primary hover:underline"
            >
              Download
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
