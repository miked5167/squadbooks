# Feature Roadmap

This document tracks planned features and enhancements for Squadbooks.

## Family Roster Enhancements

### CSV/Spreadsheet Upload for Family Roster
**Status**: Planned
**Priority**: TBD
**Requested**: 2025-11-22

**Description**: Allow users to upload a spreadsheet (CSV or Excel) with family names and emails for bulk import during the roster setup step in the onboarding wizard.

**User Need**: Teams often already have their roster in a spreadsheet. Manually entering 15-20 families is time-consuming and error-prone.

**Implementation Ideas**:
- Add "Upload CSV" or "Import Spreadsheet" button to StepRoster component
- Support CSV and Excel (.xlsx) formats
- Expected columns:
  - Family Name (required)
  - Primary Email (required)
  - Secondary Email (optional)
- Validate all emails before import
- Show preview of imported data before saving (allow editing)
- Error handling for:
  - Malformed files
  - Invalid email formats
  - Missing required columns
  - Duplicate entries
- Merge with manually entered families (append, not replace)

**Technical Considerations**:
- Use a library like `papaparse` for CSV parsing
- Use `xlsx` or `exceljs` for Excel parsing
- Client-side parsing to avoid uploading sensitive data
- Maintain same validation as manual entry

**Related Files**:
- `app/onboarding/components/StepRoster.tsx` - Add upload button and preview UI
- `app/api/onboarding/families/route.ts` - Already handles bulk family creation

### Downloadable Roster Template
**Status**: Planned
**Priority**: TBD
**Requested**: 2025-11-22

**Description**: Provide a pre-formatted template (CSV and Excel) that users can download, fill out with their team information, and then upload back into the system.

**User Need**: Users need a standardized format to know exactly what information to provide and how to structure it. A template makes it easy to collect roster data from coaches or team admins who already maintain spreadsheets.

**Template Columns**:
- Player Name (required)
- Family Name (required)
- Primary Email (required)
- Secondary Email (optional)
- Phone Number (optional)
- Notes (optional)

**Implementation Ideas**:
- "Download Template" button on StepRoster component
- Generate templates on-the-fly or provide static template files
- Two formats: CSV and Excel (.xlsx)
- Include example rows showing proper formatting
- Add instructions/header row explaining each column
- Consider adding data validation rules in Excel template (email format, phone format)

**Technical Considerations**:
- Store templates in `/public/templates/` folder or generate dynamically
- Use `xlsx` library to generate Excel files with formatting and validation
- CSV can be a simple static file
- Version templates to handle schema changes over time

**Related Features**:
- Works in conjunction with CSV/Spreadsheet Upload feature above
- Could expand to include additional fields as data model grows (jersey numbers, positions, birth dates, etc.)

---

## Payment Tracking

### Family Payment Status Dashboard
**Status**: Future consideration
**Priority**: TBD

**Description**: Track which families have paid their registration fees and which still owe money.

**Implementation Ideas**:
- Payment status field on Family model (paid, partial, unpaid)
- Amount paid vs. amount owed
- Payment history
- Email reminders for unpaid families
- Bulk payment import from bank statements

---

## Budget & Financial

### Recurring Expenses
**Status**: Future consideration
**Priority**: TBD

**Description**: Support for recurring expenses (ice time, coach fees, etc.) that happen weekly or monthly throughout the season.

---

## Reporting

### Advanced Financial Reports
**Status**: Future consideration
**Priority**: TBD

**Description**: More detailed financial reporting beyond the current CSV exports.

**Potential Reports**:
- Cash flow projections
- Variance analysis (budget vs. actual)
- Category trends over time
- Year-over-year comparisons

---

*This document will be updated as new features are requested and priorities are established.*
