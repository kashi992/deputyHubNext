import { useCallback } from 'react';
import { ContactSalutation } from '@/types/contact-salutation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const contactFields = {
  record: { 
    label: 'Record Type', 
    required: true, 
    hint: 'Must be PERSON or COMPANY' 
  },
  salutation: { 
    label: 'Salutation', 
    required: false,
    hint: `Must be one of: ${Object.values(ContactSalutation).join(', ')}` 
  },
  firstName: { label: 'First Name', required: true },
  lastName: { label: 'Last Name', required: true },
  companyName: { label: 'Company Name', required: true },
  email: { label: 'Email', required: false },
  phone1: { label: 'Primary Phone', required: false },
  phone2: { label: 'Secondary Phone', required: false },
  address: { label: 'Address', required: false },
  companyRegistrationNumber: { label: 'Company Registration', required: false },
  stage: { label: 'Stage', required: false }
} as const;

type Props = {
  csvHeaders: string[];
  mappings: Record<string, string>;
  onChange: (mappings: Record<string, string>) => void;
};

export function ColumnMapping({ csvHeaders, mappings, onChange }: Props) {
  const autoMapColumns = useCallback(() => {
    const newMappings = { ...mappings };
    
    // Auto-map based on similarity
    for (const csvHeader of csvHeaders) {
      const normalizedHeader = csvHeader.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      for (const [field, { label }] of Object.entries(contactFields)) {
        const normalizedField = label.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalizedHeader === normalizedField) {
          newMappings[field] = csvHeader;
        }
      }
    }
    
    onChange(newMappings);
  }, [csvHeaders, mappings, onChange]);

  return (
    <div className="space-y-4">
    <button
      type="button"
      onClick={autoMapColumns}
      className="inline-flex items-center px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors duration-200"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5 mr-2" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M4 5v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2zm7 12h2m-2-4h6m-6-4h6"
        />
      </svg>
      Auto-map columns
    </button>

    <div className="grid gap-4 max-h-[calc(100vh-300px)] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4 items-center sticky top-0 bg-gray-900 z-10 py-2 rounded-md px-2">
        <div className="font-semibold ">Contact Field</div>
        <div className="font-semibold ">CSV Column</div>
      </div>
      {Object.entries(contactFields).map(([field, { label, required }]) => (
        <div key={field} className="grid grid-cols-2 gap-4 items-center">
        <label className="font-mono">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <Select
          value={mappings[field] || undefined}
          onValueChange={(value) => {
            onChange({ ...mappings, [field]: value });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select column" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">Not mapped</SelectItem>
            {csvHeaders.map((header) => (
            <SelectItem key={header} value={header}>
              {header}
            </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>
      ))}
    </div>
    </div>
  );
}
