import * as XLSX from 'xlsx';
import type { Family } from '@/lib/validations/family';

export interface ParsedRoster {
  families: Partial<Family>[];
  errors: string[];
  warnings: string[];
}

/**
 * Parse an Excel file and extract family roster data
 * @param file - The uploaded Excel file
 * @returns Parsed families with any errors or warnings
 */
export async function parseRosterExcel(file: File): Promise<ParsedRoster> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const families: Partial<Family>[] = [];

  try {
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Parse workbook
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Get first worksheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      errors.push('No worksheets found in the Excel file');
      return { families, errors, warnings };
    }

    const worksheet = workbook.Sheets[firstSheetName];

    // Convert to JSON (array of arrays)
    const data = XLSX.utils.sheet_to_json<string[]>(worksheet, {
      header: 1,
      raw: false, // Get formatted values as strings
      defval: '', // Default empty cells to empty string
    });

    // Check if file has data
    if (data.length === 0) {
      errors.push('Excel file is empty');
      return { families, errors, warnings };
    }

    // Find header row (should be first row, but let's be flexible)
    let headerRowIndex = 0;
    const headers = data[headerRowIndex];

    // Map column names to indices (case-insensitive)
    const columnMap = {
      familyName: -1,
      primaryEmail: -1,
      secondaryEmail: -1,
    };

    headers.forEach((header, index) => {
      const normalized = String(header).toLowerCase().trim();

      if (normalized.includes('family') && normalized.includes('name')) {
        columnMap.familyName = index;
      } else if (normalized.includes('primary') && normalized.includes('email')) {
        columnMap.primaryEmail = index;
      } else if (normalized.includes('secondary') && normalized.includes('email')) {
        columnMap.secondaryEmail = index;
      }
    });

    // Validate required columns
    if (columnMap.familyName === -1) {
      errors.push('Missing required column: "Family Name"');
    }
    if (columnMap.primaryEmail === -1) {
      errors.push('Missing required column: "Primary Email"');
    }

    if (errors.length > 0) {
      return { families, errors, warnings };
    }

    // Parse data rows (skip header row and instruction row if present)
    let startRow = 1;

    // Check if row 2 looks like instructions (starts with "REQUIRED:" or similar)
    if (data.length > 1) {
      const firstDataCell = String(data[1][0]).trim().toUpperCase();
      if (firstDataCell.startsWith('REQUIRED') || firstDataCell.startsWith('OPTIONAL')) {
        startRow = 2; // Skip instruction row
        warnings.push('Detected instruction row, skipping it');
      }
    }

    // Look for empty row that separates instructions from data
    for (let i = startRow; i < Math.min(startRow + 3, data.length); i++) {
      const row = data[i];
      const isEmptyRow = row.every(cell => !cell || String(cell).trim() === '');
      if (isEmptyRow) {
        startRow = i + 1;
        break;
      }
    }

    // Parse each data row
    for (let i = startRow; i < data.length; i++) {
      const row = data[i];

      // Skip completely empty rows
      if (row.every(cell => !cell || String(cell).trim() === '')) {
        continue;
      }

      const familyName = String(row[columnMap.familyName] || '').trim();
      const primaryEmail = String(row[columnMap.primaryEmail] || '').trim();
      const secondaryEmail = columnMap.secondaryEmail >= 0
        ? String(row[columnMap.secondaryEmail] || '').trim()
        : '';

      // Skip rows that are clearly examples (contain "example.com")
      if (primaryEmail.toLowerCase().includes('example.com')) {
        continue;
      }

      // Skip rows with no family name AND no primary email (completely empty data)
      if (!familyName && !primaryEmail) {
        continue;
      }

      families.push({
        familyName,
        primaryEmail,
        secondaryEmail: secondaryEmail || undefined,
      });
    }

    // Add warning if no families found
    if (families.length === 0) {
      warnings.push('No family data found in the Excel file');
    }

    return { families, errors, warnings };

  } catch (error) {
    console.error('Error parsing Excel file:', error);
    errors.push(
      error instanceof Error
        ? `Failed to parse Excel file: ${error.message}`
        : 'Failed to parse Excel file'
    );
    return { families, errors, warnings };
  }
}

/**
 * Validate that a file is an Excel file
 */
export function isExcelFile(file: File): boolean {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];

  const validExtensions = ['.xlsx', '.xls'];
  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );

  return hasValidType || hasValidExtension;
}

/**
 * Validate Excel file size
 */
export function isValidFileSize(file: File, maxSizeMB = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}
