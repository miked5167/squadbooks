# Phase 3: Enhanced Filtering & PDF Support - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Add advanced filtering capabilities (multi-team selection, date ranges, missing receipts toggle, vendor/description search, column sorting) and rich PDF receipt viewing (page navigation, zoom controls, metadata display) to the existing association transaction views built in Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Filter UI layout & interaction

- **Placement:** Filters appear in a horizontal row above the transaction list
- All other filter UI decisions (timing, chip placement, clear actions) are at Claude's discretion based on UX best practices

### Team & date range controls

- All team selector, default state, date range picker, and missing receipts toggle decisions are at Claude's discretion based on UX best practices

### Search & sort behavior

- All search timing, matching, sort interaction, and filter logic decisions are at Claude's discretion based on UX best practices and performance considerations

### PDF viewer experience

- All page navigation, zoom controls, metadata layout, and mobile handling decisions are at Claude's discretion based on UX best practices and implementation considerations

### Claude's Discretion

- **Filter application timing** — Instant vs debounced vs explicit apply button
- **Filter chips display** — Between filters/table vs inline with controls
- **Clear all filters** — Prominent button vs subtle link vs individual chip removal
- **Team multi-select interaction** — Checkboxes with search vs tag-style selection
- **Team filter default state** — All teams vs none vs remembered selection
- **Date range picker UI** — Separate inputs vs single range selector vs presets
- **Missing receipts toggle placement** — Inline with filters vs prominent separate placement
- **Search timing** — Instant vs debounced vs on-enter
- **Search matching** — Case-insensitive partial vs whole word
- **Column sort interaction** — Click to toggle vs dropdown menu vs single-column only
- **Filter combination logic** — AND vs OR within categories
- **PDF page navigation** — Prev/next buttons vs thumbnails vs continuous scroll
- **PDF zoom controls** — Preset levels vs continuous zoom vs fit-to-width/page
- **PDF metadata layout** — Above viewer vs side panel vs expandable section
- **PDF mobile handling** — Optimized drawer vs full-screen modal vs native download

</decisions>

<specifics>
## Specific Ideas

- User selected filters should be prominent enough to understand what's being filtered
- Filters in a horizontal row above the list (not sidebar or collapsible section)
- All other implementation details left to standard UX patterns and best practices

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 03-enhanced-filtering-pdf-support_
_Context gathered: 2026-01-18_
