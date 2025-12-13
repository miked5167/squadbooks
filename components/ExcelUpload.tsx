'use client';

import { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { parseRosterExcel, isExcelFile, isValidFileSize } from '@/lib/excel/parse-roster';
import { validateFamilies, type Family } from '@/lib/validations/family';

interface ExcelUploadProps {
  existingFamilies: Partial<Family>[];
  onImport: (families: Family[]) => void;
  onCancel: () => void;
}

export function ExcelUpload({ existingFamilies, onImport, onCancel }: ExcelUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [validFamilies, setValidFamilies] = useState<Family[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Array<{ rowNumber: number; errors: string[] }>>([]);
  const [hasDuplicates, setHasDuplicates] = useState(false);
  const [duplicateEmails, setDuplicateEmails] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    // Validate file type
    if (!isExcelFile(selectedFile)) {
      setErrors(['Please upload an Excel file (.xlsx or .xls)']);
      return;
    }

    // Validate file size (5MB limit)
    if (!isValidFileSize(selectedFile, 5)) {
      setErrors(['File size must be less than 5MB']);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setParsing(true);

    try {
      // Parse Excel file
      const { families, errors: parseErrors, warnings } = await parseRosterExcel(selectedFile);

      if (parseErrors.length > 0) {
        setErrors(parseErrors);
        setParsing(false);
        return;
      }

      // Show warnings but continue
      if (warnings.length > 0) {
        // Warnings logged but processing continues
      }

      // Get existing emails to check for duplicates
      const existingEmails = existingFamilies
        .map(f => f.primaryEmail)
        .filter((email): email is string => !!email);

      // Validate families
      const validation = validateFamilies(families, existingEmails);

      setValidFamilies(validation.validFamilies);
      setValidationErrors(validation.errors);
      setHasDuplicates(validation.hasDuplicates);
      setDuplicateEmails(validation.duplicateEmails);
      setParsed(true);
      setParsing(false);

    } catch (error) {
      console.error('Error processing Excel file:', error);
      setErrors(['Failed to process Excel file. Please check the file format.']);
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleImport = () => {
    if (validFamilies.length > 0) {
      onImport(validFamilies);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsed(false);
    setValidFamilies([]);
    setErrors([]);
    setValidationErrors([]);
    setHasDuplicates(false);
    setDuplicateEmails([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open onOpenChange={() => onCancel()} modal>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col z-[9999] bg-white">
        <DialogHeader>
          <DialogTitle>Import Team Roster from Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file (.xlsx) containing your team roster. The file should have columns for
            Family Name, Primary Email, and Secondary Email (optional).
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {!parsed ? (
            // File Upload Area
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-golden bg-golden/10'
                  : 'border-gray-300 hover:border-golden hover:bg-gray-50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {!file ? (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Drop your Excel file here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Supported formats: .xlsx, .xls (Max size: 5MB)
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="mt-2"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                </>
              ) : (
                <>
                  {parsing ? (
                    <div className="space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden mx-auto" />
                      <p className="text-lg font-medium text-gray-700">Processing Excel file...</p>
                      <p className="text-sm text-gray-500">{file.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <CheckCircle2 className="mx-auto h-12 w-12 text-meadow" />
                      <p className="text-lg font-medium text-gray-700">File loaded successfully</p>
                      <p className="text-sm text-gray-500">{file.name}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            // Preview & Validation Results
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">
                      Found {validFamilies.length + validationErrors.length} {validFamilies.length + validationErrors.length === 1 ? 'family' : 'families'} in Excel file
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      {validFamilies.length} valid • {validationErrors.length} with errors
                    </p>
                  </div>
                </div>
              </div>

              {/* Duplicate Errors (Blocking) */}
              {hasDuplicates && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-red-900">
                        Duplicate Emails Found - Cannot Import
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        The following email addresses appear multiple times (either within the Excel file or in your existing roster):
                      </p>
                      <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                        {duplicateEmails.map(email => (
                          <li key={email}>{email}</li>
                        ))}
                      </ul>
                      <p className="text-sm text-red-700 mt-2">
                        Please remove duplicates from your Excel file and try again.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Validation Errors */}
              {validationErrors.length > 0 && !hasDuplicates && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-yellow-900">
                        {validationErrors.length} {validationErrors.length === 1 ? 'row has' : 'rows have'} validation errors
                      </p>
                      <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                        {validationErrors.map((error, idx) => (
                          <div key={idx} className="text-sm text-yellow-700">
                            <span className="font-medium">Row {error.rowNumber}:</span>{' '}
                            {error.errors.join(', ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Valid Families Preview */}
              {validFamilies.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">
                    Valid Families ({validFamilies.length})
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Family Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Primary Email
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Secondary Email
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 max-h-64 overflow-y-auto">
                        {validFamilies.slice(0, 10).map((family, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {family.familyName}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {family.primaryEmail}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {family.secondaryEmail || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {validFamilies.length > 10 && (
                      <div className="px-4 py-2 bg-gray-50 text-sm text-gray-500 text-center">
                        + {validFamilies.length - 10} more families
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Errors */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-red-900">Errors</p>
                      <ul className="mt-2 text-sm text-red-700 space-y-1">
                        {errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between items-center gap-2 sm:justify-between border-t pt-4">
          <div>
            {parsed && (
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
              >
                <X className="mr-2 h-4 w-4" />
                Choose Different File
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
            {parsed && (
              <Button
                onClick={handleImport}
                disabled={validFamilies.length === 0 || hasDuplicates}
                className="bg-navy hover:bg-navy-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import {validFamilies.length} {validFamilies.length === 1 ? 'Family' : 'Families'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
