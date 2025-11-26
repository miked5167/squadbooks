import * as XLSX from 'xlsx';

/**
 * Generate an Excel template for team roster import
 * Returns a Blob that can be downloaded by the user
 */
export function generateRosterTemplate(): Blob {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Define the header row
  const headers = ['Family Name', 'Primary Email', 'Secondary Email'];

  // Define the instructions row
  const instructions = [
    'REQUIRED: Full family name (e.g., "Smith Family")',
    'REQUIRED: Email address for primary contact',
    'OPTIONAL: Email address for secondary contact',
  ];

  // Create example rows to show format
  const examples = [
    ['Smith Family', 'john.smith@example.com', 'jane.smith@example.com'],
    ['Johnson Family', 'mike.johnson@example.com', ''],
    ['Williams Family', 'sarah.williams@example.com', 'tom.williams@example.com'],
  ];

  // Combine into worksheet data
  const worksheetData = [
    headers,
    instructions,
    [], // Empty row for spacing
    ...examples,
  ];

  // Create worksheet from data
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 25 }, // Family Name
    { wch: 35 }, // Primary Email
    { wch: 35 }, // Secondary Email
  ];

  // Style the header row (row 1)
  const headerStyle = {
    font: { bold: true, color: { rgb: '001B40' } }, // Navy blue
    fill: { fgColor: { rgb: 'FFC414' } }, // Golden yellow
    alignment: { horizontal: 'center', vertical: 'center' },
  };

  // Style the instructions row (row 2)
  const instructionStyle = {
    font: { italic: true, color: { rgb: '666666' } },
    fill: { fgColor: { rgb: 'EEEEEE' } }, // Light gray
    alignment: { wrapText: true, vertical: 'top' },
  };

  // Apply styles (Note: xlsx library has limited styling support)
  // These will only work if exported to XLSX format, not CSV
  ['A1', 'B1', 'C1'].forEach(cell => {
    if (!worksheet[cell]) worksheet[cell] = { v: '', t: 's' };
    worksheet[cell].s = headerStyle;
  });

  ['A2', 'B2', 'C2'].forEach(cell => {
    if (!worksheet[cell]) worksheet[cell] = { v: '', t: 's' };
    worksheet[cell].s = instructionStyle;
  });

  // Set row heights
  worksheet['!rows'] = [
    { hpt: 25 }, // Header row
    { hpt: 60 }, // Instructions row (taller for wrapped text)
    { hpt: 20 }, // Empty row
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Team Roster');

  // Generate binary Excel file
  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });

  // Convert to Blob
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  return blob;
}

/**
 * Trigger download of the roster template
 * @param filename - Optional custom filename (default: 'team-roster-template.xlsx')
 */
export function downloadRosterTemplate(filename = 'team-roster-template.xlsx') {
  const blob = generateRosterTemplate();

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
