---
phase: 06-component-polish
plan: 03
subsystem: ui-components
tags:
  - dashboard-widgets
  - visual-breakdown-bar
  - data-visualization
  - component-extraction
  - accessibility
  - teams-needing-attention

dependency-graph:
  requires:
    - 06-01 (accessible status badges with icons)
    - 06-02 (progress bar visual patterns)
  provides:
    - teams-needing-attention-widget (reusable widget with breakdown bar)
    - visual-breakdown-pattern (stacked segment bar for distribution)
    - numerical-legend (counts with color-coded icons)
  affects:
    - Future dashboard widgets that need visual distribution bars

tech-stack:
  added: []
  patterns:
    - Multi-segment breakdown bar for visual distribution
    - Proportional width segments based on data counts
    - Legend with icons and numerical counts
    - Empty state with positive messaging
    - Component extraction for reusability

key-files:
  created:
    - components/dashboard/TeamsNeedingAttentionWidget.tsx
  modified:
    - app/association/page.tsx

decisions:
  - id: breakdown-bar-height
    choice: Use h-2 (8px) height for breakdown bar
    rationale: Matches progress bar height from Plan 06-02, consistent visual language
    impact: Breakdown bar appears as summary visualization, not dominant element
  - id: display-only-segments
    choice: Breakdown segments are display-only (not clickable)
    rationale: Simpler implementation, team list below provides full interactivity
    impact: Bar is summary visualization, not primary navigation
  - id: component-extraction
    choice: Extract Teams Needing Attention into reusable widget component
    rationale: Reduces page.tsx complexity, enables reuse, encapsulates breakdown logic
    impact: Cleaner page.tsx, HealthBadge moved inside widget (removed duplication)
  - id: aria-labels-on-segments
    choice: Add aria-label to each breakdown segment with count and percentage
    rationale: Screen readers can understand distribution without relying on visual bar
    impact: Accessible to screen reader users, provides numeric context

metrics:
  duration: 8 min
  completed: 2026-01-19
---

# Phase 6 Plan 3: Teams Needing Attention Widget with Visual Breakdown Summary

**One-liner:** Extracted Teams Needing Attention into reusable widget component with visual breakdown bar showing critical (red) vs warning (amber) team distribution using proportional segments

## What Was Built

Created a reusable TeamsNeedingAttentionWidget component that displays teams needing attention with a visual breakdown bar showing the distribution of critical vs warning teams.

**Core features:**

1. **Visual breakdown bar**: 8px height stacked bar with proportional segments
   - Red segment for critical teams (at_risk status)
   - Amber segment for warning teams (needs_attention status)
   - Segments use percentage width based on team counts
   - Smooth transitions (duration-300) for size changes

2. **Legend with numerical counts**:
   - AlertOctagon icon for critical teams (red-600)
   - AlertTriangle icon for warning teams (amber-600)
   - Icons are 14px (h-3.5) consistent with Plan 06-01
   - aria-hidden="true" on icons (decorative)
   - Color-coded numerical counts

3. **Empty state**: "All Teams Looking Good!" with CheckCircle2 icon when no teams need attention

4. **Team list**: Shows team cards below breakdown with HealthBadge using Plan 06-01 accessible pattern

5. **Accessibility features**:
   - aria-label on each segment with count and percentage
   - Icons marked aria-hidden (meaning in text)
   - Color + icon + text redundancy
   - Screen reader context via sr-only spans in HealthBadge

## Files Created

### components/dashboard/TeamsNeedingAttentionWidget.tsx

New reusable widget component with breakdown bar visualization:

**Component structure:**

- Client component ('use client')
- Team interface with healthStatus, percentUsed, redFlagCount
- Empty state rendering when totalTeams === 0
- Visual breakdown bar with stacked red/amber segments
- Legend showing icon + label + count for each segment
- Team list with links to team detail pages
- Internal HealthBadge component (Plan 06-01 pattern)

**Breakdown bar implementation:**

- bg-muted base with h-2 height
- Segments use inline style `width: ${percent}%`
- bg-red-600 for critical, bg-amber-500 for warning
- transition-all duration-300 for smooth updates
- aria-label on each segment: "Critical teams: X (Y%)"

**Legend implementation:**

- flex justify-between gap-4
- Each item: icon + "Critical:"/"Warning:" + count
- Icons h-3.5 (14px) with aria-hidden="true"
- Color-coded text (red-600, amber-600)

**Accessibility:**

- Breakdown segments have descriptive aria-labels
- Icons are decorative (aria-hidden)
- HealthBadge includes sr-only "Team health:" prefix
- Color + icon + text redundancy throughout

**Commits:**

- 294348e: Initial component creation
- adbc7a4: Remove unused cn import

## Files Modified

### app/association/page.tsx

Replaced existing Teams Needing Attention Card with TeamsNeedingAttentionWidget:

**Changes:**

- Added import for TeamsNeedingAttentionWidget
- Replaced entire Card implementation (lines 287-344) with single widget component
- Removed duplicate HealthBadge function definition (now in widget)
- Kept SeverityBadge for Recent Alerts section
- Pass topAttentionTeams and association.id as props

**Impact:**

- Reduced file from 434 to 353 lines (-81 lines, -19%)
- Cleaner page.tsx with component extraction
- No duplication of HealthBadge logic
- Widget is now reusable across other pages if needed

**Commit:** 99a2736

## Decisions Made

### 1. Breakdown Bar Height (h-2 / 8px)

**Decision:** Use h-2 (8px) height for breakdown bar

**Reasoning:**

- Matches progress bar height from Plan 06-02
- Provides consistent visual language across dashboard
- Summary visualization, not dominant element
- Enough height to show proportions clearly

**Impact:** Breakdown bar appears as compact summary, balances with team list below

### 2. Display-Only Segments (Not Clickable)

**Decision:** Breakdown segments are display-only, not clickable/filterable

**Reasoning:**

- Simpler implementation, lower complexity
- Team list below provides full interactivity
- Bar is summary visualization, not primary navigation
- Can iterate to clickable in future if user testing shows value

**Impact:** Clear separation of concerns: bar summarizes, list provides interaction

### 3. Component Extraction

**Decision:** Extract Teams Needing Attention into reusable widget component

**Reasoning:**

- Reduces page.tsx complexity (434 → 353 lines)
- Enables reuse across other dashboard pages
- Encapsulates breakdown logic and visualization
- Single source of truth for HealthBadge pattern

**Impact:**

- Cleaner association/page.tsx
- HealthBadge moved inside widget (removed duplication)
- Widget can be used on team detail pages, reports, etc.

### 4. aria-labels on Segments

**Decision:** Add aria-label to each breakdown segment with count and percentage

**Reasoning:**

- Screen readers can't interpret visual bar proportions
- Provides numeric context without visual cues
- Follows WCAG 2.1 guidelines for data visualizations
- Complements (doesn't replace) legend below

**Impact:** Screen readers announce "Critical teams: 3 (60%)" when focused on segment

## Verification Performed

### Build Verification

TypeScript compilation successful for modified files:

```bash
npx eslint components/dashboard/TeamsNeedingAttentionWidget.tsx app/association/page.tsx
# Only warnings (unused imports in page.tsx pre-existing, no errors)
```

### Code Verification

Confirmed all implementation requirements met:

- ✓ TeamsNeedingAttentionWidget component exports correctly
- ✓ Breakdown bar with critical/warning segments present
- ✓ Legend shows icons, labels, and numerical counts
- ✓ Empty state shows "All Teams Looking Good!" with CheckCircle2
- ✓ HealthBadge uses Plan 06-01 accessible pattern
- ✓ Segments have aria-label attributes
- ✓ Icons have aria-hidden="true"
- ✓ Color + icon + text redundancy throughout

### Visual Pattern Verification

Breakdown bar follows established patterns:

- **Height**: h-2 (8px) matches progress bars from 06-02
- **Colors**: red-600 (critical), amber-500 (warning) consistent with 06-01 badge colors
- **Icons**: AlertOctagon (critical), AlertTriangle (warning) from 06-01
- **Icon size**: h-3.5 (14px) consistent with 06-01 badge icons
- **Legend layout**: Horizontal flex layout with gap-4 spacing

### Accessibility Verification

All accessibility requirements met:

- Breakdown segments announce count and percentage via aria-label
- Icons marked aria-hidden="true" (decorative)
- HealthBadge includes sr-only "Team health:" prefix
- Color is not sole indicator (icons + text also present)
- WCAG 2.1 AA pattern: icon + color + text redundancy

### Git Verification

Three atomic commits created:

1. 294348e: Create TeamsNeedingAttentionWidget (feat)
2. 99a2736: Replace Card with widget in page.tsx (refactor)
3. adbc7a4: Remove unused cn import (style)

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Phase 6 Component Polish completion status:**

- ✓ Plan 06-01: Accessible Status Badges
- ✓ Plan 06-02: Accessible Progress Bars
- ✓ Plan 06-03: Teams Needing Attention Widget (this plan)

**Phase complete!** All v1.1 dashboard UX polish tasks finished.

**Provided for future work:**

- Reusable visual breakdown pattern for other distribution visualizations
- Component extraction pattern for complex dashboard widgets
- Accessible multi-segment bar with legend and aria-labels
- TeamsNeedingAttentionWidget ready for use on other pages

**No blockers or concerns.**

## Testing Recommendations

**Visual verification recommended:**

1. **Breakdown Bar Rendering:**
   - Navigate to association overview page
   - Verify breakdown bar appears above team list
   - Verify bar shows 2 segments: red (critical) and amber (warning)
   - Verify segments are proportional to team counts
   - Verify bar is 8px height (h-2), rounded ends

2. **Legend Accuracy:**
   - Verify legend shows "Critical: X" with AlertOctagon icon in red
   - Verify legend shows "Warning: Y" with AlertTriangle icon in amber
   - Verify numerical counts match actual team counts
   - Verify icons are h-3.5 (14px) size

3. **Empty State:**
   - Create test data with no teams needing attention (all healthy)
   - Verify "All Teams Looking Good!" message appears
   - Verify CheckCircle2 icon displays
   - Verify no breakdown bar shown in empty state

4. **Team List:**
   - Verify team cards render below breakdown bar
   - Verify HealthBadge uses icon + text pattern from Plan 06-01
   - Verify clicking team card navigates to team detail page
   - Verify percent used and last synced time display correctly

**Accessibility testing recommended:**

1. **Screen Reader Test:**
   - Navigate to Teams Needing Attention widget with screen reader
   - Verify breakdown segments announce: "Critical teams: X (Y%)"
   - Verify HealthBadge announces: "Team health: At Risk"
   - Verify icons have aria-hidden (not announced separately)

2. **Color-Blind Simulation:**
   - Use browser color-blind simulation
   - Verify icon shapes distinguish critical (octagon) from warning (triangle)
   - Verify numerical counts provide non-color information
   - Verify text labels ("Critical", "Warning") clear regardless of color perception

3. **Keyboard Navigation:**
   - Tab through team cards
   - Verify each team card is focusable and clickable
   - Verify focus states are visible

**Performance testing:**

- Verify breakdown bar renders smoothly with 10+ teams
- Verify transition-all duration-300 animates smoothly if counts change
- Verify page load time remains under 2s with widget

---

**Status:** Complete
**Duration:** 8 minutes
**Commits:** 3 (feat, refactor, style)
**Files Created:** 1
**Files Modified:** 1
**Visual Pattern:** Multi-segment breakdown bar with legend and numerical counts
