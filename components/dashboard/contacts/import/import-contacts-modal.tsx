import { useState, useCallback, useEffect } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { useRouter } from 'next/navigation';

interface ImportError {
  row: number;
  error: string;
  rowData: Record<string, string>; // Add rowData to store the problematic row
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ColumnMapping } from './column-mapping';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2Icon } from 'lucide-react';

const isRowEmpty = (row: Record<string, string>) => {
  return Object.values(row).every(value => !value || value.trim() === '');
};

export const ImportContactsModal = NiceModal.create(() => {
  const modal = useModal();
  const router = useRouter();
  const [step, setStep] = useState<'upload' | 'map' | 'importing' | 'review'>('upload');
  const [csvData, setCsvData] = useState<Array<Record<string, string>>>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Filter out completely empty rows
          const nonEmptyRows = (results.data as Array<Record<string, string>>)
            .filter(row => !isRowEmpty(row));
          
          setCsvData(nonEmptyRows);
          setHeaders(results.meta.fields || []);
          setStep('map');
        },
        error: () => {
          toast.error('Failed to parse CSV file');
        }
      });
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  const handleImport = async () => {
    setStep('importing');
    setImportErrors([]);
    const loadingToast = toast.loading('Importing contacts...');

    try {
      const response = await fetch('/api/import/csv/contact-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mappings,
          data: csvData
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      if (result.errors.length > 0) {
        setImportErrors(result.errors);
        setStep('review'); // New step for reviewing errors
        toast.error(
          `${result.errors.length} rows couldn't be imported. Please review the errors.`
        );
      } else {
        toast.success(result.message);
        // Refresh the contacts list
        router.refresh();
        modal.hide();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed');
      setStep('map');
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  // Reset state when modal is closed
  useEffect(() => {
    if (!modal.visible) {
      setStep('upload');
      setCsvData([]);
      setHeaders([]);
      setMappings({});
    }
  }, [modal.visible]);

  return (
    <Dialog open={modal.visible} onOpenChange={modal.hide}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
          <DialogDescription>
            {step === 'upload' && "Import your contacts from a CSV file. For person records, first and last names are required. For company records, company name is required."}
            {step === 'review' && "The following rows couldn't be imported. Please fix the data and try again."}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div
            {...getRootProps()}
            className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <input {...getInputProps()} />
            <p>Drag & drop a CSV file here, or click to select one</p>
          </div>
        )}

        {step === 'review' && importErrors.length > 0 && (
          <div className="space-y-6">
            <Alert variant="destructive">
              <AlertTitle className="mb-4">Import Errors</AlertTitle>
              <AlertDescription>
                <ScrollArea className="h-[400px] w-full pr-4">
                  <div className="space-y-4">
                    {importErrors.map((error, index) => (
                      <div key={index} className="rounded-lg border p-4 bg-destructive/5">
                        <div className="font-medium text-destructive mb-2">
                          Row {error.row}: {error.error}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(error.rowData).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="font-medium">{key}:</span>
                              <span>{value || '(empty)'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setStep('upload')}>
                Start Over
              </Button>
              <Button variant="outline" onClick={() => {
                modal.hide();
                window.location.reload();
              }}>
                Close
              </Button>
            </div>
          </div>
        )}

        {step === 'map' && (
          <div className="space-y-6">            
            <ColumnMapping
              csvHeaders={headers}
              mappings={mappings}
              onChange={setMappings}
            />
            
            <Button
              onClick={handleImport}
              className="w-full"
            >
              Import Contacts
            </Button>
          </div>
        )}

        {step === 'importing' && (
          <div className="text-center py-8">
            <Loader2Icon className="size-8 animate-spin mx-auto" />
            <p className="mt-2">Importing contacts...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});
