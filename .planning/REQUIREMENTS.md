# Requirements: Squadbooks

**Defined:** 2026-01-19
**Core Value:** Association leaders can quickly identify teams with missing receipts and verify compliance with spending policies across all teams in their association.

## v1.1 Requirements - Dashboard UX Polish

Requirements for applying QuickBooks and FreshBooks design patterns to improve dashboard visual hierarchy and scannability.

### Visual Hierarchy

- [ ] **UX-01**: Apply QuickBooks 4px spacing grid system across all dashboard components (card padding p-6, grid gaps gap-4/gap-6, section spacing space-y-8)
- [ ] **UX-02**: Implement QuickBooks typography hierarchy with systematic type scale (12px badges, 14px labels, 18px headings, 30px metrics with appropriate font weights)

### Status Indicators

- [ ] **UX-03**: Enhance status badges with accessibility features including icons (CheckCircle for healthy, AlertTriangle for warning, AlertOctagon for critical) and WCAG 2.1 AA compliant colors (green-100/800, amber-100/800, red-100/800)

### Financial Visualizations

- [ ] **UX-04**: Apply FreshBooks progress bar styling to budget indicators (8px height, rounded-full container, dynamic color thresholds: <75% green, 75-90% amber, >90% red, smooth 300ms transitions)

### Teams Needing Attention Widget

- [ ] **UX-05**: Implement FreshBooks "Outstanding Invoices" pattern with visual breakdown bar showing critical vs warning team distribution, numerical counts with color coding, and CTA button to review teams

## v2 Requirements

Deferred UI/UX enhancements for future releases.

### Advanced Interactions

- **UX-06**: Add QuickBooks hover elevation pattern to all interactive cards (shadow-sm to shadow-md, -translate-y-0.5, 200ms transition)
- **UX-07**: Add trend indicators to KPI cards (TrendingUp/TrendingDown icons with percentage changes)
- **UX-08**: Implement dashboard customization (hide/show widgets, save user preferences)
- **UX-09**: Add sparklines to summary cards for 7-day trends

### Advanced Features

- **UX-10**: Horizontal alerts carousel pattern for Recent Alerts section
- **UX-11**: Card/table view toggle for Connected Teams grid
- **UX-12**: Progressive disclosure patterns for team details

## Out of Scope

| Feature                     | Reason                                   |
| --------------------------- | ---------------------------------------- |
| Complete dashboard redesign | v1.1 focuses on polish, not restructure  |
| New dashboard sections      | Only improving existing sections         |
| Data visualization charts   | Focus on UI polish, not new chart types  |
| Custom color theming        | Maintain HuddleBooks brand (navy/golden) |
| Dashboard layout reordering | Keep existing structure that works       |
| Mobile-specific dashboard   | Existing responsive design sufficient    |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase   | Status  |
| ----------- | ------- | ------- |
| UX-01       | Phase 5 | Pending |
| UX-02       | Phase 5 | Pending |
| UX-03       | Phase 6 | Pending |
| UX-04       | Phase 6 | Pending |
| UX-05       | Phase 6 | Pending |

**Coverage:**

- v1.1 requirements: 5 total
- Mapped to phases: 5 (100% coverage)
- Unmapped: 0

---

_Requirements defined: 2026-01-19_
_Last updated: 2026-01-19 after roadmap creation_
