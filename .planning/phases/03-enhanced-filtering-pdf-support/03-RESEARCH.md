# Phase 3: Enhanced Filtering & PDF Support - Research

**Researched:** 2026-01-19
**Domain:** React transaction filtering, URL state management, PDF viewing
**Confidence:** HIGH

## Summary

Phase 3 adds advanced filtering capabilities (multi-team, date ranges, missing receipts, vendor/description search, column sorting) and enhanced PDF receipt viewing (page navigation, zoom controls, metadata display) to existing association transaction views.

Research focused on three primary domains:

1. **URL-based filter state management** - Next.js App Router patterns for shareable/bookmarkable filtered views
2. **Filter UI patterns** - Multi-select dropdowns, date range pickers, removable chips, debounced search
3. **PDF viewing enhancements** - React PDF viewer libraries with navigation and zoom controls

The standard stack is already present in the codebase: Next.js 15 App Router, React 19, Radix UI primitives, react-day-picker for date selection, and Tailwind CSS. The codebase already implements basic team filtering with URL state sync (TeamFilter.tsx) and basic PDF viewing with iframe (ReceiptViewer.tsx). Phase 3 extends these patterns.

**Primary recommendation:** Build on existing patterns (useSearchParams + URL sync, Radix UI primitives, react-day-picker), add react-pdf for enhanced PDF viewing with page navigation, and implement debounced search with 300-500ms delay.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library          | Version                      | Purpose                                             | Why Standard                                                                |
| ---------------- | ---------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| next             | 15.1.3                       | App Router with useSearchParams, searchParams props | Next.js App Router is the framework - provides URL state primitives         |
| react-day-picker | 9.11.1                       | Date range selection component                      | Already in dependencies, integrates with Radix UI, WCAG 2.1 AA compliant    |
| react-pdf        | Latest (wojtekmaj/react-pdf) | PDF rendering with page navigation                  | Industry standard React PDF.js wrapper with 7K+ GitHub stars, minimal setup |
| date-fns         | 4.1.0                        | Date formatting and manipulation                    | Already in dependencies, required by react-day-picker                       |

### Supporting

| Library                 | Version | Purpose                                      | When to Use                                                            |
| ----------------------- | ------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| vaul                    | 1.1.2   | Drawer component (mobile-first)              | Already used for TransactionDetailsDrawer - extend for PDF metadata    |
| @radix-ui/react-popover | 1.1.15  | Multi-select dropdown container              | Already used in TeamFilter - reuse pattern for other filters           |
| @radix-ui/react-dialog  | 1.1.15  | Modal for full-screen PDF viewing            | Already in dependencies, alternative to drawer for desktop PDF viewing |
| cmdk                    | 1.1.1   | Command palette for searchable team selector | Already used in TeamFilter - proven pattern                            |

### Alternatives Considered

| Instead of       | Could Use                   | Tradeoff                                                                            |
| ---------------- | --------------------------- | ----------------------------------------------------------------------------------- |
| react-pdf        | PDF.js iframe (current)     | Iframe lacks page navigation/zoom - acceptable for simple viewing only              |
| react-pdf        | @react-pdf/renderer         | Wrong use case - renderer is for PDF generation, not viewing                        |
| useSearchParams  | nuqs library                | nuqs is cleaner API but adds 6kB dependency - not needed, existing pattern works    |
| react-day-picker | Material UI DateRangePicker | MUI adds 300kB+ bundle size - unnecessary with existing Radix UI + react-day-picker |

**Installation:**

```bash
npm install react-pdf
# All other dependencies already present in package.json
```

## Architecture Patterns

### Recommended Project Structure

```
components/
├── transactions/
│   ├── TeamFilter.tsx              # EXISTING - multi-select team dropdown
│   ├── DateRangeFilter.tsx         # NEW - date range picker with presets
│   ├── MissingReceiptsToggle.tsx   # NEW - toggle button for receipts filter
│   ├── TransactionSearch.tsx       # NEW - debounced vendor/description search
│   ├── FilterChips.tsx             # NEW - removable chips for active filters
│   ├── transaction-details-drawer.tsx  # EXISTING - extend for enhanced PDF viewing
│   └── TransactionsSection.tsx     # EXISTING - extend for new filters
├── receipts/
│   ├── ReceiptViewer.tsx           # EXISTING - replace iframe with react-pdf
│   ├── PDFNavigator.tsx            # NEW - page controls (prev/next/jump)
│   └── PDFZoomControls.tsx         # NEW - zoom in/out/fit controls
└── ui/
    ├── drawer.tsx                  # EXISTING - vaul drawer primitive
    └── dialog.tsx                  # EXISTING - radix dialog primitive
```

### Pattern 1: URL-Driven Filter State

**What:** Client components read searchParams via useSearchParams hook, update URL via router.push, server components receive searchParams prop
**When to use:** All filter controls - maintains shareable URLs and browser back/forward support
**Example:**

```typescript
// components/transactions/DateRangeFilter.tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export function DateRangeFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleDateChange = (range: DateRange) => {
    const params = new URLSearchParams(searchParams.toString())
    if (range?.from) {
      params.set('dateFrom', range.from.toISOString().split('T')[0])
    }
    if (range?.to) {
      params.set('dateTo', range.to.toISOString().split('T')[0])
    }
    params.delete('cursor') // Reset pagination
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return <DateRangePicker onSelect={handleDateChange} />
}
```

### Pattern 2: Debounced Search with URL Sync

**What:** Local state for instant input feedback, debounced effect to update URL after user stops typing
**When to use:** Text search inputs where immediate API calls would cause performance issues
**Example:**

```typescript
// components/transactions/TransactionSearch.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function TransactionSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [localValue, setLocalValue] = useState(searchParams.get('search') || '')

  // Debounce: 300ms delay after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (localValue.trim()) {
        params.set('search', localValue.trim())
      } else {
        params.delete('search')
      }
      params.delete('cursor') // Reset pagination
      router.push(`?${params.toString()}`, { scroll: false })
    }, 300)

    return () => clearTimeout(timer)
  }, [localValue])

  return (
    <Input
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      placeholder="Search vendor or description..."
    />
  )
}
```

### Pattern 3: React PDF with Virtualization

**What:** Render PDF pages on-demand using react-pdf with worker for performance
**When to use:** Viewing PDF receipts with multiple pages
**Example:**

```typescript
// components/receipts/ReceiptViewer.tsx (enhanced)
'use client'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

export function PDFViewer({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)

  return (
    <Document
      file={url}
      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      options={{
        cMapUrl: 'https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/',
        cMapPacked: true,
      }}
    >
      <Page
        pageNumber={pageNumber}
        scale={scale}
        renderTextLayer={true}
        renderAnnotationLayer={true}
      />
      {/* Navigation and zoom controls */}
      <PDFNavigator
        currentPage={pageNumber}
        totalPages={numPages}
        onPageChange={setPageNumber}
      />
      <PDFZoomControls
        scale={scale}
        onScaleChange={setScale}
      />
    </Document>
  )
}
```

### Pattern 4: Filter Chips with Array Filtering

**What:** Display active filters as removable chips, use controlled component pattern with parent state
**When to use:** Above transaction list to show which filters are applied
**Example:**

```typescript
// components/transactions/FilterChips.tsx
'use client'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

interface FilterChipsProps {
  filters: Array<{ key: string; label: string; value: string }>
  onRemove: (key: string) => void
  onClearAll: () => void
}

export function FilterChips({ filters, onRemove, onClearAll }: FilterChipsProps) {
  if (filters.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {filters.map(filter => (
        <Badge key={filter.key} variant="secondary" className="gap-2">
          <span>{filter.label}: {filter.value}</span>
          <button
            onClick={() => onRemove(filter.key)}
            className="hover:bg-gray-300 rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      {filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-gray-600 hover:text-gray-900 underline"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Don't use window.history.replaceState directly** - Breaks Next.js navigation and back button. Use router.push/replace instead
- **Don't render all PDF pages at once** - For PDFs with 25+ pages, causes memory issues. Render current page only
- **Don't skip scroll: false in router.push** - Causes page jump when filters update. Always include `{ scroll: false }`
- **Don't store derived filter state separately** - Read directly from searchParams, don't duplicate in local state except for debouncing

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                           | Don't Build                   | Use Instead                      | Why                                                                                                               |
| --------------------------------- | ----------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| PDF rendering in browser          | Custom canvas rendering logic | react-pdf (wojtekmaj/react-pdf)  | PDF.js is complex - text layers, annotations, worker threads, memory management. 7K+ stars, battle-tested         |
| Date range selection UI           | Custom calendar component     | react-day-picker with range mode | WCAG 2.1 AA compliant, handles edge cases (month boundaries, leap years, disabled dates). Already in dependencies |
| Debouncing search input           | Manual setTimeout management  | useEffect + setTimeout cleanup   | Easy to create memory leaks, stale closures. Pattern is proven and simple                                         |
| URL state serialization           | Custom query string parsing   | URLSearchParams API              | Built-in browser API, handles encoding/decoding, array values, edge cases                                         |
| Multi-select dropdown with search | Custom autocomplete           | Radix UI Popover + cmdk          | Accessibility (keyboard nav, screen readers), virtualization for large lists. Already used in TeamFilter          |

**Key insight:** PDF rendering and date selection are deceptively complex domains with accessibility, performance, and cross-browser edge cases. Use specialized libraries rather than custom implementations.

## Common Pitfalls

### Pitfall 1: URL State Causing Infinite Re-render Loop

**What goes wrong:** Filter component reads searchParams, updates URL, which triggers re-render, which updates URL again
**Why it happens:** useEffect without proper dependencies or missing early return when value hasn't changed
**How to avoid:**

1. Use debouncing for text inputs (local state → effect updates URL)
2. Compare current URL value with new value before updating
3. Include all searchParams dependencies in useEffect array
   **Warning signs:** Browser console shows rapid navigation events, URL updates continuously

### Pitfall 2: PDF Worker Not Loading (CORS/CDN Issues)

**What goes wrong:** PDF doesn't render, console shows worker script errors
**Why it happens:** PDF.js worker must be served from same origin or with CORS headers
**How to avoid:**

1. Use unpkg.com CDN for worker (avoids CORS issues)
2. Alternative: Copy worker to public/ folder and reference locally
3. Set `pdfjs.GlobalWorkerOptions.workerSrc` before first render
   **Warning signs:** Console error: "Setting up fake worker", PDF shows blank

### Pitfall 3: Large PDFs Crashing Browser

**What goes wrong:** Rendering multi-page PDF receipt causes browser tab to freeze or crash
**Why it happens:** Rendering all pages at once consumes excessive memory
**How to avoid:**

1. Render only current page (pageNumber prop)
2. For very large PDFs (100+ pages), add page range limits
3. Don't set renderTextLayer/renderAnnotationLayer unless needed for search/copy
   **Warning signs:** Browser DevTools shows >500MB memory usage, UI becomes unresponsive

### Pitfall 4: Losing Filter State on Browser Back Button

**What goes wrong:** User applies filters, navigates away, uses back button - filters are cleared
**Why it happens:** Using window.history.replaceState or not properly reading searchParams on mount
**How to avoid:**

1. Always use router.push (not window.history)
2. Initialize filter state from searchParams in useEffect on mount
3. Pass `{ scroll: false }` to prevent scroll jump
   **Warning signs:** Back button doesn't restore filter state, URL has params but UI shows defaults

### Pitfall 5: Date Range Picker Timezone Issues

**What goes wrong:** User selects Jan 15, API receives Jan 14 or Jan 16
**Why it happens:** Date objects convert between local timezone and UTC inconsistently
**How to avoid:**

1. Store dates in URL as ISO date strings (YYYY-MM-DD, no time component)
2. Parse with UTC methods: `new Date(dateString + 'T00:00:00Z')`
3. Display in user's timezone but send UTC to API
   **Warning signs:** Date filters off by one day, inconsistent behavior across timezones

### Pitfall 6: Search Debounce Not Cancelling Pending Requests

**What goes wrong:** User types quickly, multiple API requests fire, results arrive out of order
**Why it happens:** Debouncing delays the request but doesn't cancel in-flight requests
**How to avoid:**

1. Use AbortController to cancel previous fetch when new one starts
2. Track request sequence number and ignore stale responses
3. Show loading state only after debounce fires
   **Warning signs:** Search results flicker, wrong results displayed, network tab shows overlapping requests

### Pitfall 7: Filter Chips Not Syncing with URL State

**What goes wrong:** User clears filter chip, but URL still has parameter (or vice versa)
**Why it happens:** Chip removal updates local state but not URL, or derives chips from stale state
**How to avoid:**

1. Derive filter chips directly from searchParams (single source of truth)
2. Chip removal should update URL via router.push
3. Don't maintain separate "activeFilters" array
   **Warning signs:** Chips and URL params don't match, refresh changes filter state

## Code Examples

Verified patterns from research and codebase analysis:

### Date Range Filter with Presets

```typescript
// components/transactions/DateRangeFilter.tsx
'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { DateRange } from 'react-day-picker'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

export function DateRangeFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read from URL
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  const [range, setRange] = useState<DateRange | undefined>({
    from: dateFrom ? new Date(dateFrom + 'T00:00:00Z') : undefined,
    to: dateTo ? new Date(dateTo + 'T00:00:00Z') : undefined,
  })

  const handleSelect = (newRange: DateRange | undefined) => {
    setRange(newRange)

    const params = new URLSearchParams(searchParams.toString())
    if (newRange?.from) {
      params.set('dateFrom', format(newRange.from, 'yyyy-MM-dd'))
    } else {
      params.delete('dateFrom')
    }
    if (newRange?.to) {
      params.set('dateTo', format(newRange.to, 'yyyy-MM-dd'))
    } else {
      params.delete('dateTo')
    }
    params.delete('cursor')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const presets = [
    { label: 'Last 7 days', range: { from: subDays(new Date(), 7), to: new Date() } },
    { label: 'Last 30 days', range: { from: subDays(new Date(), 30), to: new Date() } },
    { label: 'This month', range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) } },
  ]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {range?.from ? (
            range.to ? (
              `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d, yyyy')}`
            ) : (
              format(range.from, 'MMM d, yyyy')
            )
          ) : (
            'Select date range'
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets */}
          <div className="flex flex-col gap-1 border-r p-3">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                onClick={() => handleSelect(preset.range)}
                className="justify-start font-normal"
              >
                {preset.label}
              </Button>
            ))}
            {range && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSelect(undefined)}
                className="justify-start font-normal text-red-600"
              >
                Clear
              </Button>
            )}
          </div>
          {/* Calendar */}
          <Calendar
            mode="range"
            selected={range}
            onSelect={handleSelect}
            numberOfMonths={2}
            defaultMonth={range?.from}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

### Missing Receipts Toggle

```typescript
// components/transactions/MissingReceiptsToggle.tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export function MissingReceiptsToggle() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const missingOnly = searchParams.get('missingReceipts') === 'true'

  const handleToggle = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    if (checked) {
      params.set('missingReceipts', 'true')
    } else {
      params.delete('missingReceipts')
    }
    params.delete('cursor')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        id="missing-receipts"
        checked={missingOnly}
        onCheckedChange={handleToggle}
      />
      <Label htmlFor="missing-receipts">Missing receipts only</Label>
    </div>
  )
}
```

### Enhanced PDF Viewer with Navigation

```typescript
// components/receipts/EnhancedPDFViewer.tsx
'use client'
import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

interface EnhancedPDFViewerProps {
  url: string
  onClose: () => void
}

export function EnhancedPDFViewer({ url, onClose }: EnhancedPDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [loading, setLoading] = useState(true)

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
  }

  const canZoomIn = scale < 3.0
  const canZoomOut = scale > 0.5
  const canPrevPage = pageNumber > 1
  const canNextPage = pageNumber < numPages

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-2">
          {/* Page Navigation */}
          <Button
            size="sm"
            variant="outline"
            disabled={!canPrevPage || loading}
            onClick={() => setPageNumber(p => p - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm">
            Page {pageNumber} of {numPages || '...'}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={!canNextPage || loading}
            onClick={() => setPageNumber(p => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <Button
            size="sm"
            variant="outline"
            disabled={!canZoomOut}
            onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={!canZoomIn}
            onClick={() => setScale(s => Math.min(3.0, s + 0.25))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          {/* Download */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(url, '_blank')}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4 flex items-center justify-center">
        {loading && (
          <div className="text-center text-gray-600">Loading PDF...</div>
        )}
        <Document
          file={url}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={(error) => console.error('PDF load error:', error)}
          loading={null}
          options={{
            cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
            cMapPacked: true,
          }}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-lg"
          />
        </Document>
      </div>
    </div>
  )
}
```

### Column Sort Integration

```typescript
// app/transactions/page.tsx (partial - sort handler)
'use client'

type SortField = 'date' | 'amount' | 'category' | 'vendor'
type SortDir = 'asc' | 'desc'

function useTransactionSort() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const sortBy = (searchParams.get('sortBy') as SortField) || 'date'
  const sortDir = (searchParams.get('sortDir') as SortDir) || 'desc'

  const handleSort = (field: SortField) => {
    const params = new URLSearchParams(searchParams.toString())

    // Toggle direction if clicking same field, default desc for new field
    const newDir = field === sortBy && sortDir === 'desc' ? 'asc' : 'desc'

    params.set('sortBy', field)
    params.set('sortDir', newDir)
    params.delete('cursor')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return { sortBy, sortDir, handleSort }
}

// Usage in table header
<TableHead
  className="cursor-pointer hover:bg-gray-100"
  onClick={() => handleSort('date')}
>
  Date
  {sortBy === 'date' && (
    <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  )}
</TableHead>
```

## State of the Art

| Old Approach                   | Current Approach                      | When Changed                | Impact                                                   |
| ------------------------------ | ------------------------------------- | --------------------------- | -------------------------------------------------------- |
| Manual query string parsing    | URLSearchParams API                   | 2021+ (all modern browsers) | Type-safe, handles encoding/edge cases, less boilerplate |
| Client-only filter state       | URL-based filter state                | Next.js App Router (2023+)  | Shareable links, browser back/forward support, better UX |
| Full-page PDF iframe           | react-pdf with page-by-page rendering | 2020+ (react-pdf v5+)       | Page navigation, zoom controls, better memory management |
| Custom debounce implementation | useEffect + setTimeout pattern        | React 18+ (2022+)           | Simpler, fewer bugs, automatic cleanup                   |
| Material UI DatePicker         | react-day-picker + Radix primitives   | 2024+ (shadcn/ui pattern)   | Smaller bundle, better Tailwind integration, composable  |
| window.history.pushState       | Next.js router.push                   | Next.js 13+ App Router      | Prevents breaking back button, integrates with framework |

**Deprecated/outdated:**

- **nuqs library for URL state** - Useful but unnecessary for this codebase (already has working pattern, 6kB overhead not justified)
- **PDF.js direct integration** - Avoid manual PDF.js - react-pdf wrapper handles worker setup, memory management, React lifecycle
- **Server-side searchParams in client components** - Can't use await searchParams in client components (Next.js 15+), must use useSearchParams hook

## Open Questions

Things that couldn't be fully resolved:

1. **Should filter chips show for single-value filters (e.g., missing receipts toggle)?**
   - What we know: Multi-value filters (teams, date range) benefit from chips for clarity
   - What's unclear: Whether showing "Missing receipts: Yes" as chip adds value or clutter
   - Recommendation: Show chips for all non-default filters - promotes discoverability and consistency

2. **How to handle mobile responsiveness for date range picker with 2-month calendar?**
   - What we know: Desktop shows 2 months side-by-side, mobile viewport too narrow
   - What's unclear: Whether to show 1 month on mobile or use different UI pattern
   - Recommendation: Use `numberOfMonths={2}` on desktop (md:), `numberOfMonths={1}` on mobile - react-day-picker supports conditional rendering

3. **Should PDF viewer use Dialog (modal) or extend existing Drawer pattern?**
   - What we know: TransactionDetailsDrawer uses Sheet/Drawer (vaul), ReceiptViewer uses Dialog
   - What's unclear: Whether to consolidate on one pattern or maintain both
   - Recommendation: Keep Dialog for PDF viewing (full-screen focus), Drawer for transaction details (side panel with context)

4. **Performance threshold for when to limit PDF page rendering?**
   - What we know: PDF.js recommends max 25 pages rendered, receipts typically 1-3 pages
   - What's unclear: At what file size or page count should we add warnings or restrictions
   - Recommendation: No restrictions needed initially (receipts are short) - monitor if 10+ page receipts become common

## Sources

### Primary (HIGH confidence)

- Next.js 15.1.3 official documentation - useSearchParams, router.push, App Router patterns (nextjs.org/docs)
- react-day-picker 9.11.1 documentation - Range mode, calendar component (daypicker.dev)
- react-pdf GitHub repository - wojtekmaj/react-pdf (7K+ stars, maintained, examples verified)
- Existing codebase patterns - TeamFilter.tsx (URL state sync), TransactionDetailsDrawer.tsx (drawer pattern), ReceiptViewer.tsx (current PDF handling)

### Secondary (MEDIUM confidence)

- WebSearch (Jan 2025): "React URL state management Next.js App Router 2025" - nuqs library, URL state best practices
- WebSearch (Jan 2025): "react-day-picker date range tutorial 2025" - Implementation patterns for range selection
- WebSearch (Jan 2025): "PDF viewer React component navigation zoom 2025" - Comparison of react-pdf vs alternatives
- WebSearch (Jan 2025): "React filter debouncing best practices 2025" - 300-500ms delay consensus, useEffect pattern

### Tertiary (LOW confidence)

- WebSearch: "filter chips removable React pattern 2025" - Material UI pattern (different framework, but concept applies)
- WebSearch: "URL state pitfalls Next.js back button 2025" - Community discussions of edge cases
- WebSearch: "react-pdf performance large files 2025" - GitHub issues for performance optimization

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All libraries already in dependencies except react-pdf, patterns proven in codebase
- Architecture: HIGH - Extending existing patterns (TeamFilter, TransactionDetailsDrawer), Next.js App Router is well-documented
- Pitfalls: MEDIUM - Based on WebSearch and GitHub issues, not all verified in this codebase context

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - stable domain, established patterns)
