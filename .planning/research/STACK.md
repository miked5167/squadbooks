# Stack Research

**Domain:** Association-level transaction oversight dashboards
**Researched:** 2026-01-18
**Confidence:** HIGH

## Executive Summary

For adding association-level transaction viewing and receipt oversight to an existing Next.js sports team management app, the stack additions focus on **advanced table functionality** (filtering, sorting, search), **URL state management** for shareable filtered views, and **PDF receipt viewing**. The existing stack (Next.js 15, shadcn/ui, date-fns) already provides the foundation; we only need targeted additions.

**Key recommendation:** Use TanStack Table with nuqs for URL-based state management. The existing infrastructure handles most other needs.

## Recommended Stack

### Core Technologies for Transaction Dashboards

| Technology                | Version | Purpose                                                                 | Why Recommended                                                                                                                                                                                                   |
| ------------------------- | ------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **@tanstack/react-table** | ^8.21.3 | Advanced table functionality with sorting, filtering, column management | Industry standard for complex data tables in React. Headless architecture integrates seamlessly with existing shadcn/ui components. Excellent TypeScript support and performance with large datasets (10K+ rows). |
| **nuqs**                  | ^2.8.6  | Type-safe URL state management for filters and search                   | Provides React.useState-like API that syncs with URL query parameters. Essential for shareable filtered views. Only 6KB gzipped. Next.js 15 App Router ready with native Server Component support.                |
| **react-pdf**             | ^10.x   | PDF receipt viewing in browser                                          | Most popular open-source React PDF viewer. Built on PDF.js foundation. Handles receipts stored as PDFs alongside images. Provides zoom, pan, and multi-page support for complex receipts.                         |

### Supporting Libraries

| Library                   | Version                | Purpose                               | When to Use                                                                                                                                                           |
| ------------------------- | ---------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **pdfjs-dist**            | Bundled with react-pdf | PDF.js worker for react-pdf           | Required dependency for react-pdf. Use the version bundled with react-pdf to avoid version mismatch errors.                                                           |
| **@tanstack/react-query** | ^5.x (optional)        | Server-side data fetching and caching | **Optional but recommended** for server-side filtering/pagination if dataset exceeds 10K transactions. Integrates well with TanStack Table for managing server state. |

### Already Available (No Installation Needed)

| Library             | Current Version | Purpose                       | Notes                                                                                                   |
| ------------------- | --------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| **date-fns**        | ^4.1.0          | Date formatting and filtering | Already in package.json. Use for transaction date ranges and display formatting.                        |
| **shadcn/ui Table** | Installed       | Base table components         | Provides styled table primitives (Table, TableHeader, TableRow, etc.) that TanStack Table will enhance. |
| **Next.js Image**   | ^15.1.3         | Image receipt optimization    | Built into Next.js. Use for displaying image receipts (JPG, PNG, WebP). Automatic optimization.         |
| **xlsx**            | ^0.18.5         | Excel export                  | Already in package.json. Use for exporting transaction reports.                                         |

## Installation

```bash
# New required packages
npm install @tanstack/react-table nuqs react-pdf

# Optional (for server-side data operations with large datasets)
npm install @tanstack/react-query

# Already installed - no action needed
# - date-fns (^4.1.0)
# - xlsx (^0.18.5)
# - shadcn/ui components
```

## Alternatives Considered

| Recommended        | Alternative               | When to Use Alternative                                                                                                                                                                                                    | Confidence |
| ------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **TanStack Table** | AG Grid Community         | Use AG Grid if you need Excel-like features (advanced filtering UI, row grouping, pivoting) and don't mind 200KB+ bundle size. For association oversight (read-only viewing), TanStack Table is sufficient and 6x lighter. | HIGH       |
| **nuqs**           | next-usequerystate        | nuqs has better TypeScript support, smaller bundle size (6KB vs 8KB), and more active maintenance in 2025. next-usequerystate is viable but less feature-rich.                                                             | HIGH       |
| **react-pdf**      | PDF.js direct integration | Use direct PDF.js integration for highly customized PDF rendering. react-pdf provides simpler React API for standard viewing use case.                                                                                     | MEDIUM     |
| **date-fns**       | dayjs                     | Already using date-fns. dayjs is 2KB smaller but migration has no benefit. date-fns v4 has better tree-shaking and first-class timezone support.                                                                           | HIGH       |

## What NOT to Use

| Avoid                               | Why                                                                                                                                 | Use Instead                                   | Confidence |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------- |
| **Material UI Table / MRT**         | Requires full Material UI dependency (~300KB). Conflicts with existing shadcn/ui design system. Introduces UI inconsistency.        | TanStack Table with shadcn/ui components      | HIGH       |
| **React Table v7**                  | Deprecated. Replaced by TanStack Table v8. No longer maintained.                                                                    | @tanstack/react-table (v8)                    | HIGH       |
| **useSearchParams hook only**       | Next.js useSearchParams requires manual type parsing, lacks debouncing, and has poor DX for complex state. Hard to maintain.        | nuqs for type-safe URL state                  | HIGH       |
| **@react-pdf/renderer**             | This is for _creating_ PDFs (server-side rendering), NOT viewing them. Wrong use case.                                              | react-pdf (wojtekmaj) for viewing             | HIGH       |
| **pdfjs-dist as direct dependency** | Version mismatches between react-pdf and pdfjs-dist cause "API version doesn't match Worker version" errors. PDF.js ignores semver. | Use pdfjs-dist version bundled with react-pdf | HIGH       |

## Stack Patterns by Use Case

### Pattern 1: Client-Side Filtering (Recommended Start)

**When to use:** Dataset < 10,000 transactions per association

**Stack:**

- TanStack Table with client-side filtering/sorting
- nuqs for URL state (filters, search, pagination)
- date-fns for date range filters
- Existing shadcn/ui components for UI

**Why:** Simpler implementation. No API changes needed. Fast user experience with instant filtering. Most associations won't exceed this limit.

**Performance:** TanStack Table handles 10K rows with good client-side performance. Use React.useMemo for data preprocessing.

### Pattern 2: Server-Side Operations (For Scale)

**When to use:** Dataset > 10,000 transactions OR multi-association views with 100K+ total transactions

**Stack:**

- TanStack Table with `manualPagination`, `manualFiltering`, `manualSorting`
- TanStack Query for server data fetching and caching
- nuqs for URL state (syncs to server requests)
- Server API routes for filtered queries

**Why:** Reduces client bundle size. Enables filtering across associations at scale. Better initial page load with partial data.

**API pattern:**

```typescript
GET /api/associations/[id]/transactions?page=1&pageSize=50&status=EXCEPTION&search=vendor&sort=date:desc
```

### Pattern 3: Receipt Display

**For image receipts (JPG, PNG, WebP):**

- Use Next.js `<Image>` component with Supabase Storage URLs
- Automatic optimization and lazy loading
- Already implemented in existing codebase

**For PDF receipts:**

- react-pdf with `<Document>` and `<Page>` components
- Display in existing drawer pattern (similar to ReceiptViewer)
- PDF.js worker configuration required

**Mixed receipt types:**

- Detect file extension from receiptUrl
- Conditional render: Image component for images, react-pdf for PDFs

## Version Compatibility

| Package               | Version | Compatible With              | Notes                                                                                                                                                           |
| --------------------- | ------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| @tanstack/react-table | ^8.21.3 | React ^19.0.0, Next.js ^15.x | Supports React Server Components. Use Server Components for data fetching, Client Components for interactive table.                                             |
| nuqs                  | ^2.8.6  | Next.js ^15.x App Router     | Requires NuqsAdapter wrapper in root layout for Next.js >=14.2.0. Zero runtime dependencies as of v2.8.                                                         |
| react-pdf             | ^10.x   | React ^19.0.0, Next.js ^15.x | Requires `swcMinify: false` in next.config.js for Next.js <15. For v15+, works without modification. Must configure PDF.js worker in same module as components. |
| pdfjs-dist            | Bundled | react-pdf ^10.x              | Do NOT install separately. Use version from react-pdf's node_modules to avoid API/Worker version conflicts.                                                     |
| date-fns              | ^4.1.0  | All modern browsers          | Tree-shakeable. v4 has first-class timezone support via @date-fns/tz if needed for multi-timezone associations.                                                 |

## Implementation Considerations

### TanStack Table + shadcn/ui Integration

shadcn/ui provides [official data table guide](https://ui.shadcn.com/docs/components/data-table) for integrating TanStack Table. This is the **recommended starting point**.

**Key pattern:**

1. Create `<DataTable>` component using shadcn/ui guide
2. Define column definitions with TanStack Table `createColumnHelper`
3. Use existing shadcn/ui `Table`, `TableHeader`, `TableRow`, `TableCell` primitives
4. Add filtering/sorting/pagination controls using shadcn/ui `Input`, `Select`, `Button`

**Column definition example:**

```typescript
// columns.tsx
const columnHelper = createColumnHelper<Transaction>()

export const columns = [
  columnHelper.accessor('transactionDate', {
    header: 'Date',
    cell: info => format(info.getValue(), 'MMM d, yyyy'),
    sortingFn: 'datetime',
  }),
  columnHelper.accessor('vendor', {
    header: 'Vendor',
    cell: info => info.getValue(),
    filterFn: 'includesString',
  }),
  // ... more columns
]
```

### nuqs URL State Setup

**1. Wrap root layout:**

```typescript
// app/layout.tsx
import { NuqsAdapter } from 'nuqs/adapters/next/app'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  )
}
```

**2. Define typed search params:**

```typescript
// hooks/useTransactionFilters.ts
import { useQueryStates, parseAsString, parseAsInteger, parseAsStringEnum } from 'nuqs'

export function useTransactionFilters() {
  return useQueryStates({
    search: parseAsString.withDefault(''),
    status: parseAsStringEnum(['EXCEPTION', 'VALIDATED', 'ALL']).withDefault('ALL'),
    page: parseAsInteger.withDefault(1),
    teamId: parseAsString,
  })
}
```

**3. Use in components:**

```typescript
const [filters, setFilters] = useTransactionFilters()
// URL automatically syncs: ?search=vendor&status=EXCEPTION&page=2
```

### react-pdf Configuration

**Critical setup for Next.js:**

```typescript
// components/PDFReceiptViewer.tsx
'use client'

import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// Configure worker (REQUIRED)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export function PDFReceiptViewer({ receiptUrl }: { receiptUrl: string }) {
  return (
    <Document file={receiptUrl}>
      <Page pageNumber={1} />
    </Document>
  )
}
```

**Important:** Worker configuration must be in the same file where you use `<Document>` to avoid initialization race conditions.

### Date Filtering with date-fns

Project already uses date-fns v4.1.0. Use for:

**1. Display formatting:**

```typescript
import { format } from 'date-fns'
format(transaction.transactionDate, 'MMM d, yyyy') // "Jan 15, 2026"
```

**2. Date range filtering:**

```typescript
import { isWithinInterval, parseISO } from 'date-fns'

const filteredTransactions = transactions.filter(t =>
  isWithinInterval(parseISO(t.transactionDate), {
    start: startDate,
    end: endDate,
  })
)
```

**3. Sorting:**

```typescript
import { compareAsc } from 'date-fns'
transactions.sort((a, b) => compareAsc(a.transactionDate, b.transactionDate))
```

### Export to Excel (Already Available)

Project already has `xlsx` v0.18.5 installed. Use for transaction export:

```typescript
import * as XLSX from 'xlsx'

function exportToExcel(transactions: Transaction[]) {
  const worksheet = XLSX.utils.json_to_sheet(
    transactions.map(t => ({
      Date: format(t.transactionDate, 'yyyy-MM-dd'),
      Vendor: t.vendor,
      Amount: t.amount,
      Status: t.status,
      Category: t.category?.name,
    }))
  )

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')
  XLSX.writeFile(workbook, `transactions-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
}
```

## Performance Guidelines

### Client-Side Table Performance

| Row Count | Performance | Recommendation                                                                                 |
| --------- | ----------- | ---------------------------------------------------------------------------------------------- |
| < 1,000   | Excellent   | Client-side everything. No virtualization needed.                                              |
| 1K - 10K  | Good        | Client-side filtering/sorting. Consider virtualization for rendering (react-window if needed). |
| 10K - 50K | Moderate    | Server-side pagination required. Client-side filtering acceptable with useMemo optimization.   |
| > 50K     | Poor        | Full server-side operations (filter, sort, paginate). Use TanStack Query for caching.          |

**For association oversight:** Most associations have < 5,000 transactions/year. Client-side approach is sufficient.

### Optimization Techniques

**1. Memoize expensive computations:**

```typescript
const data = useMemo(() => transactions.map(mapTransactionToUIState), [transactions])
```

**2. Debounce search input:**

```typescript
const [filters, setFilters] = useTransactionFilters()

// nuqs has built-in debounce support
const debouncedSearch = useDebounce(filters.search, 300)
```

**3. Paginate results:**

```typescript
const table = useReactTable({
  data,
  columns,
  initialState: { pagination: { pageSize: 50 } },
  getPaginationRowModel: getPaginationRowModel(),
})
```

## Migration from Existing Code

### Current State Analysis

Project currently uses:

- **TransactionsPreviewTable.tsx**: Custom table with basic status badges
- **transaction-details-drawer.tsx**: Drawer with receipt viewing (images only)
- **shadcn/ui Table components**: Styled table primitives
- **date-fns**: Already using `format()` for dates

### Migration Path

**Phase 1: Add TanStack Table (No UI changes)**

1. Install `@tanstack/react-table`
2. Refactor `TransactionsPreviewTable` to use TanStack Table under the hood
3. Keep existing shadcn/ui Table components for rendering
4. Test: Should look identical, but with sorting enabled

**Phase 2: Add URL State with nuqs**

1. Install `nuqs` and add `NuqsAdapter` to root layout
2. Create `useTransactionFilters` hook
3. Connect filters to table state
4. Test: URL should update when filtering

**Phase 3: Add PDF Receipt Support**

1. Install `react-pdf`
2. Extend `ReceiptViewer` component to handle PDFs
3. Update `transaction-details-drawer` to detect file type
4. Test: Both image and PDF receipts display

**Phase 4: Advanced Filtering UI**

1. Add filter controls (status dropdown, search input, date range)
2. Wire to nuqs state
3. Connect to TanStack Table column filters
4. Test: Shareable filtered URLs work

## Security Considerations

### Receipt URL Access Control

**Existing pattern:** Supabase Storage with row-level security (RLS)

**For association users:**

- Association users should only access receipts for teams in their association
- Verify access in API route before serving Supabase signed URLs
- receipt URLs from Supabase already require authentication

**Implementation:**

```typescript
// app/api/receipts/[id]/route.ts
const { associationId } = await getAssociationContext(userId)
const transaction = await prisma.transaction.findUnique({
  where: { id },
  include: { team: true },
})

if (transaction.team.associationId !== associationId) {
  return new Response('Forbidden', { status: 403 })
}
```

### URL State Validation

**Risk:** Users can manually edit URL parameters

**Mitigation:**

- nuqs provides type-safe parsing with fallbacks
- Validate parsed values before using in queries
- Use `.withDefault()` for required filters

```typescript
parseAsStringEnum(['EXCEPTION', 'VALIDATED', 'ALL']).withDefault('ALL')
// Invalid values fall back to 'ALL'
```

## Testing Considerations

### TanStack Table Testing

**Test sorting:**

```typescript
const table = useReactTable({ data, columns })
table.getColumn('transactionDate')?.toggleSorting()
expect(table.getRowModel().rows[0].original.vendor).toBe('Expected')
```

**Test filtering:**

```typescript
table.getColumn('vendor')?.setFilterValue('Nike')
expect(table.getRowModel().rows).toHaveLength(expectedCount)
```

### nuqs Testing

**Mock URL state in tests:**

```typescript
// Use testWrapper from nuqs
import { NuqsAdapter } from 'nuqs/adapters/next/app'

render(
  <NuqsAdapter>
    <YourComponent />
  </NuqsAdapter>
)
```

### react-pdf Testing

**Mock PDF.js in tests:**

```typescript
vi.mock('react-pdf', () => ({
  Document: ({ children }) => <div>{children}</div>,
  Page: () => <div>PDF Page</div>,
  pdfjs: { GlobalWorkerOptions: { workerSrc: '' } }
}))
```

## Sources

### High Confidence (Official Docs & Context7)

- TanStack Table: https://tanstack.com/table/latest/docs/introduction (verified 2026-01-18)
- nuqs: https://nuqs.dev/ (verified 2026-01-18)
- react-pdf: https://github.com/wojtekmaj/react-pdf (verified 2026-01-18)
- shadcn/ui Data Table: https://ui.shadcn.com/docs/components/data-table
- date-fns v4: https://date-fns.org/ (already in project)
- Next.js Image: https://nextjs.org/docs/app/api-reference/components/image

### Medium Confidence (Recent Articles, Multiple Sources)

- TanStack Table vs AG Grid comparison: https://www.simple-table.com/blog/tanstack-table-vs-ag-grid-comparison (2025)
- Server-side patterns with TanStack Table: Medium articles from 2024-2025 (multiple sources agree)
- nuqs adoption trends: React Advanced 2025 conference coverage (InfoQ)
- date-fns vs dayjs: shadcn-ui community discussion #4817

### Low Confidence (Flagged for Validation)

- TanStack Query integration patterns - not yet verified for this specific use case
- Performance benchmarks (10K row thresholds) - based on community consensus, not official benchmarks

---

**Research completed:** 2026-01-18
**Confidence level:** HIGH for core recommendations, MEDIUM for optional optimizations
**Ready for roadmap:** Yes - focused additions to existing stack, minimal disruption
