# Phase 6: Component Polish - Research

**Researched:** 2026-01-19
**Domain:** Accessible UI components with WCAG 2.1 AA compliance
**Confidence:** HIGH

## Summary

Research focused on implementing accessible status indicators and financial visualizations using industry-standard patterns. The standard approach combines WCAG 2.1 AA compliant color contrast with redundant visual signaling (icons + color + text) to ensure usability for color-blind users. Progress bars follow modern financial dashboard patterns with dynamic color thresholds and smooth transitions.

**Key findings:**

- WCAG 2.1 AA requires 4.5:1 contrast for normal text, 3:1 for large text and UI components
- Tailwind color combinations (100/800 shades) provide accessible contrast when properly applied
- Icons must be paired with visually-hidden text for screen reader accessibility, NOT aria-label
- Progress bars use 8px height, rounded-full styling, and dynamic color transitions (green/amber/red)
- Multi-segment progress bars visualize status distribution with 3-7 segments recommended

**Primary recommendation:** Use Badge component with icon-left + text-right layout, 100/800 Tailwind shade combinations, visually-hidden screen reader text, and Radix Progress with dynamic color thresholds.

## Standard Stack

The established libraries/tools for accessible status indicators and progress bars:

### Core

| Library                  | Version  | Purpose                | Why Standard                                                                                          |
| ------------------------ | -------- | ---------------------- | ----------------------------------------------------------------------------------------------------- |
| lucide-react             | ^0.468.0 | Icon library           | Already in project. CheckCircle, AlertTriangle, AlertOctagon available. Official accessibility guide. |
| @radix-ui/react-progress | ^1.1.8   | Progress bar primitive | Already in project. Accessible by default, supports custom styling.                                   |
| Tailwind CSS             | ^4.1.17  | Color utilities        | Already in project. OKLCH colors, accessible shade combinations.                                      |
| class-variance-authority | ^0.7.1   | Badge variants         | Already in project. Type-safe variant management.                                                     |

### Supporting

| Library                 | Version | Purpose            | When to Use                                                 |
| ----------------------- | ------- | ------------------ | ----------------------------------------------------------- |
| @radix-ui/react-tooltip | ^1.2.8  | Status tooltips    | Already in project. For additional status context on hover. |
| tailwindcss-animate     | ^1.0.7  | Smooth transitions | Already in project. For progress bar color transitions.     |

### Alternatives Considered

| Instead of      | Could Use                | Tradeoff                                                                                                            |
| --------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Radix Progress  | Custom div progress bar  | Radix provides accessibility out-of-box (ARIA attributes, keyboard support). Custom requires manual implementation. |
| lucide-react    | heroicons or react-icons | Lucide has better TypeScript support and official accessibility documentation. Already in project.                  |
| Tailwind colors | Custom CSS colors        | Tailwind OKLCH ensures perceptual uniformity. Custom colors require manual contrast verification.                   |

**Installation:**

```bash
# All dependencies already installed - no additional packages needed
```

## Architecture Patterns

### Recommended Component Structure

```
components/
├── ui/
│   ├── badge.tsx           # Existing - extend with status variants
│   ├── progress.tsx        # Existing - extend with dynamic colors
│   └── status-badge.tsx    # New - accessible status indicator
├── dashboard/
│   ├── ParentBudgetOverview.tsx       # Update progress bars
│   ├── ValidationComplianceCard.tsx   # Update status badges
│   └── teams-needing-attention/       # New - visual breakdown widget
│       ├── BreakdownBar.tsx
│       └── TeamList.tsx
```

### Pattern 1: Accessible Status Badge (Icon + Color + Text)

**What:** Badge component combining icon, color, and text with screen reader support

**When to use:** Any status indicator (healthy/warning/critical, compliant/exception, etc.)

**Example:**

```typescript
// Source: Lucide accessibility guide + WCAG 2.1 best practices
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react'

interface StatusBadgeProps {
  status: 'healthy' | 'warning' | 'critical'
  label: string
  count?: number
}

export function StatusBadge({ status, label, count }: StatusBadgeProps) {
  const config = {
    healthy: {
      icon: CheckCircle,
      variant: 'success' as const, // bg-green-100 text-green-800
      srText: 'Status: Healthy'
    },
    warning: {
      icon: AlertTriangle,
      variant: 'warning' as const, // bg-amber-100 text-amber-800
      srText: 'Warning status'
    },
    critical: {
      icon: AlertOctagon,
      variant: 'destructive' as const, // bg-red-100 text-red-800
      srText: 'Critical status'
    }
  }

  const { icon: Icon, variant, srText } = config[status]

  return (
    <Badge variant={variant} className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="sr-only">{srText}: </span>
      <span>{label}</span>
      {count !== undefined && <span className="ml-0.5">({count})</span>}
    </Badge>
  )
}
```

**Key principles:**

- Icon has `aria-hidden="true"` (decorative, meaning conveyed by text)
- Screen reader text uses `.sr-only` NOT `aria-label` (better browser/translation support)
- Color + icon + text provide redundant signaling (accessible to color-blind users)
- Icon size 3.5 (14px) pairs well with text-xs (12px) badge text

### Pattern 2: Dynamic Progress Bar (FreshBooks Style)

**What:** Progress bar with dynamic color thresholds and smooth transitions

**When to use:** Budget usage, completion percentage, any progress indicator

**Example:**

```typescript
// Source: Radix Progress + FreshBooks design patterns
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface BudgetProgressProps {
  value: number // 0-100
  spent: number
  budget: number
  thresholds?: { amber: number; red: number }
}

export function BudgetProgress({
  value,
  spent,
  budget,
  thresholds = { amber: 70, red: 90 }
}: BudgetProgressProps) {
  // Determine color based on thresholds
  const getColor = (percent: number) => {
    if (percent >= thresholds.red) return 'bg-red-600'
    if (percent >= thresholds.amber) return 'bg-amber-500'
    return 'bg-green-600'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">Budget Usage</span>
        <span className="font-semibold">
          ${spent.toLocaleString()} / ${budget.toLocaleString()}
        </span>
      </div>

      <Progress
        value={Math.min(value, 100)}
        className="h-2 rounded-full" // 8px height, fully rounded
        indicatorClassName={cn(
          "transition-all duration-300", // Smooth color transitions
          getColor(value)
        )}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className={cn(
          "font-medium",
          value >= thresholds.red && "text-red-600",
          value >= thresholds.amber && value < thresholds.red && "text-amber-600",
          value < thresholds.amber && "text-green-600"
        )}>
          {value.toFixed(1)}% used
        </span>
        <span>${(budget - spent).toLocaleString()} remaining</span>
      </div>
    </div>
  )
}
```

**Key principles:**

- Height: h-2 (8px) matches FreshBooks compact style
- Rounded: rounded-full for pill-shaped ends
- Transitions: duration-300 for smooth color changes (not jarring)
- Percentage outside bar (above) for readability
- Color matches text color for redundant signaling

### Pattern 3: Multi-Segment Breakdown Bar

**What:** Stacked segments showing distribution across status categories

**When to use:** Teams Needing Attention widget, status distribution visualization

**Example:**

```typescript
// Source: Multi-segment progress bar design patterns
interface BreakdownSegment {
  label: string
  count: number
  color: string
  icon: React.ComponentType<{ className?: string }>
}

interface BreakdownBarProps {
  segments: BreakdownSegment[]
  total: number
}

export function BreakdownBar({ segments, total }: BreakdownBarProps) {
  return (
    <div className="space-y-3">
      {/* Visual bar */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        {segments.map((segment, idx) => {
          const percentage = (segment.count / total) * 100
          return (
            <div
              key={idx}
              className={cn("h-full transition-all duration-300", segment.color)}
              style={{ width: `${percentage}%` }}
              aria-label={`${segment.label}: ${segment.count} teams (${percentage.toFixed(1)}%)`}
            />
          )
        })}
      </div>

      {/* Legend with counts */}
      <div className="flex items-center justify-between gap-4 text-xs">
        {segments.map((segment, idx) => {
          const Icon = segment.icon
          return (
            <div key={idx} className="flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-muted-foreground">{segment.label}:</span>
              <span className="font-semibold">{segment.count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

**Key principles:**

- Keep segments 3-7 max (avoid clutter)
- Each segment has aria-label for screen readers
- Legend below provides numerical counts (don't rely on bar visual alone)
- Icons reinforce meaning (CheckCircle/green, AlertTriangle/amber, AlertOctagon/red)

### Anti-Patterns to Avoid

- **Color-only signaling:** Never use color alone for status. Always combine with icon + text.
- **aria-label on icons:** Use `.sr-only` spans instead - better translation and screen reader support.
- **Missing screen reader text:** Icons with aria-hidden="true" need accompanying text for context.
- **Instant color changes:** Progress bars should transition smoothly (300ms) not snap between colors.
- **Too many segments:** More than 7 segments makes breakdown bars cluttered and hard to read.
- **Percentage inside narrow bars:** For 8px height bars, put percentage outside/above for readability.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                     | Don't Build                      | Use Instead                                | Why                                                                                                                                                |
| --------------------------- | -------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Progress bar accessibility  | Custom div with background-image | @radix-ui/react-progress                   | Radix includes ARIA attributes (role, aria-valuemin, aria-valuemax, aria-valuenow), keyboard support, RTL support. Hand-rolled bars miss these.    |
| Screen reader text hiding   | Custom CSS opacity/positioning   | Tailwind .sr-only                          | .sr-only has been battle-tested across screen readers. Custom solutions often break with zoom, mobile screen readers, or specific AT combinations. |
| Color contrast verification | Eyeballing colors                | WebAIM Contrast Checker or automated tools | Human vision can't accurately judge 4.5:1 vs 4.3:1 contrast. WCAG lawsuits are real (4,605 in 2024). Must verify programmatically.                 |
| Badge variant management    | String concatenation of classes  | class-variance-authority (CVA)             | CVA provides type-safe variants, compound variants, and better IntelliSense. String concatenation is error-prone and untyped.                      |
| Icon accessibility          | aria-label attributes            | aria-hidden + visually-hidden text         | aria-label has inconsistent screen reader support, doesn't translate well, and can be forgotten. Visually-hidden text is more robust.              |

**Key insight:** Accessibility is full of edge cases. ARIA attributes seem simple but have browser/AT compatibility issues. Radix Progress and established patterns handle these edge cases. Custom solutions miss RTL support, keyboard navigation, focus management, and screen reader quirks.

## Common Pitfalls

### Pitfall 1: Insufficient Color Contrast

**What goes wrong:** Using Tailwind colors without verifying contrast ratios. Example: green-200/green-700 may look fine but fail WCAG 2.1 AA (4.5:1).

**Why it happens:** Developers assume all Tailwind shade combinations are accessible. Not true - need 700+ difference for text, but varies by color.

**How to avoid:**

- Use 100/800 or 50/900 combinations for badges (high contrast)
- Verify with WebAIM Contrast Checker or automated tools
- Stick to proven combinations: green-100/green-800, amber-100/amber-800, red-100/red-800

**Warning signs:**

- Badge text hard to read in bright sunlight
- Color-blind simulation shows poor distinction
- Automated accessibility scanners flag contrast issues

**Safe Tailwind combinations (MEDIUM confidence - WebSearch verified):**

- Light backgrounds (50-200) with dark text (700-900)
- Rule of thumb: 50+ shade difference = WCAG AA, 70+ = AAA (US Government standard)
- For badges: bg-{color}-100 with text-{color}-800 is consistently safe

### Pitfall 2: Icon-Only Status Indicators

**What goes wrong:** Using icons without text labels (just green checkmark, red X). Screen reader users get "checkmark" without context - checkmark for what?

**Why it happens:** Developers think icons are self-explanatory. They are for sighted users who see surrounding context, but screen readers read linearly.

**How to avoid:**

- Always pair icons with visible text labels: "Healthy", "Warning", "Critical"
- If space constrained, use visually-hidden text: `<span className="sr-only">Status: Healthy</span>`
- Never rely on aria-label alone - use `.sr-only` spans

**Warning signs:**

- Testing with screen reader announces "image" or "checkmark" without status context
- Icons change meaning in different contexts (green checkmark = complete vs healthy vs approved)

### Pitfall 3: Progress Bar Color Thresholds Without Redundant Signaling

**What goes wrong:** Progress bar changes from green to red at 90% but no other visual cue. Color-blind users can't distinguish green vs red.

**Why it happens:** Developers focus on visual polish, forget color-blindness affects 8% of males, 0.5% of females.

**How to avoid:**

- Pair color with text: "85% used (Watch)" or "95% used (Over Budget)"
- Use icons alongside color: AlertTriangle appears when threshold crossed
- Consider patterns/stripes for segments (though less common in modern design)

**Warning signs:**

- Running color-blind simulator (Figma plugin, online tools) shows no distinction
- Only difference between states is hue (green vs red, blue vs orange)

### Pitfall 4: Missing Percentage Values on Progress Bars

**What goes wrong:** Progress bar shows visual fill but no numerical percentage. Users can't tell if bar is 73% or 76% full.

**Why it happens:** Designers prioritize minimalism, forget numerical precision matters for budgets.

**How to avoid:**

- Always show percentage text: "73.2% used" near progress bar
- Place outside/above bar for 8px height bars (inside placement unreadable)
- Include absolute values too: "$7,320 / $10,000"

**Warning signs:**

- User testing shows users guessing percentages ("about three-quarters full")
- Financial stakeholders asking "exactly how much is spent?"

### Pitfall 5: aria-label Over Visually-Hidden Text

**What goes wrong:** Using `aria-label="Status: Healthy"` on icon instead of visually-hidden span. Works in some screen readers but fails in others.

**Why it happens:** aria-label seems simpler than extra span. Developers unaware of compatibility issues.

**How to avoid:**

- Default to `.sr-only` spans for screen reader text
- Use aria-label only on container elements (buttons, links), not content elements
- Follow Lucide accessibility guide: "avoid aria-label when possible"

**Warning signs:**

- Translation services don't translate aria-label (only visible text)
- Certain screen reader/browser combos don't announce aria-label
- Maintenance: aria-label buried in code, easy to forget updating

**Correct pattern:**

```tsx
// GOOD
<Badge variant="success">
  <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
  <span className="sr-only">Status: </span>
  Healthy
</Badge>

// BAD
<Badge variant="success">
  <CheckCircle className="h-3.5 w-3.5" aria-label="Status: Healthy" />
  Healthy
</Badge>
```

### Pitfall 6: Too Many Breakdown Segments

**What goes wrong:** Visual breakdown bar with 10+ segments becomes cluttered mess, hard to distinguish.

**Why it happens:** Developers try to show all categories. "More data = better, right?"

**How to avoid:**

- Limit to 3-7 segments (research consensus)
- Group small categories into "Other"
- For detailed breakdown, use table below bar

**Warning signs:**

- Segments so thin they're barely visible
- Legend wraps to multiple lines
- Users can't correlate segment to legend

## Code Examples

Verified patterns from official sources:

### Existing Badge Component (Extend for Status)

```typescript
// Source: C:\Users\miked\Squadbooks\components\ui\badge.tsx
// Already has success/warning variants - ready for status badges
import { Badge } from '@/components/ui/badge'

// Current variants:
// - default: bg-primary text-primary-foreground
// - secondary: bg-secondary text-secondary-foreground
// - destructive: bg-destructive text-destructive-foreground (RED)
// - success: bg-green-100 text-green-800 (GREEN) ✓
// - warning: bg-yellow-100 text-yellow-800 (AMBER) ✓

// Usage:
<Badge variant="success">
  <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
  <span className="sr-only">Status: </span>
  Healthy
</Badge>

<Badge variant="warning">
  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
  <span className="sr-only">Warning: </span>
  Needs Attention
</Badge>

<Badge variant="destructive">
  <AlertOctagon className="h-3.5 w-3.5" aria-hidden="true" />
  <span className="sr-only">Critical: </span>
  At Risk
</Badge>
```

**Note:** Badge component already has success (green) and warning (yellow/amber) variants. Destructive variant uses red. Need to verify if yellow vs amber is used (context shows yellow-100/yellow-800, requirements specify amber).

### Existing Progress Component (Extend for Dynamic Colors)

```typescript
// Source: C:\Users\miked\Squadbooks\components\ui\progress.tsx
// Radix Progress with indicatorClassName prop - perfect for dynamic colors
import { Progress } from '@/components/ui/progress'

// Current implementation:
// - h-2 (8px) default height ✓
// - rounded-full container ✓
// - indicatorClassName prop for dynamic styling ✓
// - transition-all for smooth animations ✓

// Already being used in ParentBudgetOverview:
<Progress
  value={Math.min(percentageUsed, 100)}
  className="h-3" // Override to 12px
  indicatorClassName={
    percentageUsed >= 95
      ? 'bg-red-600'
      : percentageUsed >= 85
        ? 'bg-yellow-600'
        : undefined // Default bg-primary
  }
/>

// Can enhance with smooth transitions:
indicatorClassName={cn(
  "transition-colors duration-300", // Add smooth color transitions
  percentageUsed >= 90 ? 'bg-red-600' :
  percentageUsed >= 70 ? 'bg-amber-500' :
  'bg-green-600'
)}
```

**Note:** Current implementation uses h-3 (12px). Requirements specify 8px (h-2). Thresholds currently 85/95, requirements specify 70/90. Need alignment.

### Screen Reader Text Pattern (Already in Use)

```typescript
// Source: C:\Users\miked\Squadbooks\components\transactions\TransactionHealthCell.tsx
// Project already uses .sr-only for screen reader text

// Line 222:
<span className="sr-only">View health details</span>

// Tailwind provides .sr-only utility:
// - position: absolute
// - width: 1px; height: 1px
// - padding: 0; margin: -1px
// - overflow: hidden
// - clip: rect(0, 0, 0, 0)
// - white-space: nowrap
// - border-width: 0

// Apply to status badges:
<Badge variant="success">
  <CheckCircle aria-hidden="true" />
  <span className="sr-only">Healthy status - </span>
  Healthy
</Badge>
```

### Current Status Indicator Usage

```typescript
// Source: C:\Users\miked\Squadbooks\components\dashboard\ParentBudgetOverview.tsx
// Lines 29-55 - Current status determination logic

const getBudgetStatus = () => {
  if (percentageUsed >= 95) {
    return {
      label: 'Over Budget',
      variant: 'destructive' as const,
      icon: AlertTriangle,
      color: 'text-red-600',
    }
  } else if (percentageUsed >= 85) {
    return {
      label: 'Watch',
      variant: 'warning' as const,
      icon: AlertTriangle,
      color: 'text-yellow-600',
    }
  } else {
    return {
      label: 'On Track',
      variant: 'success' as const,
      icon: CheckCircle2,
      color: 'text-green-600',
    }
  }
}

// Lines 68-71 - Current badge usage
<Badge variant={status.variant} className="flex items-center gap-1">
  <StatusIcon className="h-3 w-3" />
  {status.label}
</Badge>
```

**Current state analysis:**

- Already uses icon + text pattern ✓
- Uses CheckCircle2 and AlertTriangle from lucide-react ✓
- Missing: screen reader text with .sr-only
- Missing: aria-hidden="true" on icons
- Threshold: 85/95 (requirements specify 70/90 for progress bars)
- Icon size: h-3 (12px) - could increase to h-3.5 (14px) for better visibility

## State of the Art

| Old Approach                       | Current Approach                     | When Changed                        | Impact                                                                |
| ---------------------------------- | ------------------------------------ | ----------------------------------- | --------------------------------------------------------------------- |
| aria-label on icons                | visually-hidden spans                | 2023-2024 (Lucide v0.x)             | Better screen reader support, translation support, easier maintenance |
| Separate red/green/yellow variants | Semantic success/warning/destructive | 2024 (CVA adoption)                 | Type-safe, clearer intent, consistent naming                          |
| RGB/Hex colors                     | OKLCH color space                    | 2024-2025 (Tailwind v4)             | Perceptually uniform, better accessibility, consistent contrast       |
| Progress value inside bar          | Value outside/above                  | 2024-2025 (FreshBooks, modern SaaS) | Better readability at small heights (8px), clearer for users          |
| Static progress colors             | Dynamic color thresholds             | 2023-2024 (SaaS dashboards)         | Real-time feedback, clearer budget status, better UX                  |

**Deprecated/outdated:**

- **Custom .visuallyhidden classes:** Tailwind's .sr-only is standard now (Tailwind v3+)
- **aria-describedby for icon labels:** Replaced by visually-hidden text pattern (better support)
- **Thick progress bars (16px+):** Modern trend toward slim bars (8px) with external labels (FreshBooks, QuickBooks)
- **Icon-only badges:** Accessibility guidelines now mandate text labels, not just tooltips

## Open Questions

Things that couldn't be fully resolved:

1. **Amber vs Yellow Tailwind Colors**
   - What we know: Requirements specify "amber", Badge component uses "yellow-100/yellow-800", context mentions "amber-100/amber-800"
   - What's unclear: Which color family to use - amber or yellow? Tailwind has both.
   - Recommendation: Use amber (more orange-toned, better distinction from green). Update Badge warning variant from yellow to amber if needed. Verify with color-blind simulation.

2. **Exact Progress Bar Color Threshold Values**
   - What we know: Context specifies green <70%, amber 70-90%, red >90%. Current implementation uses 85/95 thresholds.
   - What's unclear: Are these hard requirements or Claude's discretion? Current code suggests 85/95 is in use.
   - Recommendation: Align on 70/90 per requirements. Update ParentBudgetOverview component. Test with realistic budget data to ensure thresholds feel right (not too sensitive).

3. **Contrast Ratio Verification for Specific Tailwind Combinations**
   - What we know: 100/800 shade combinations generally pass WCAG AA (WebSearch sources indicate 50+ difference = AA). Tailwind v4 uses OKLCH for perceptual uniformity.
   - What's unclear: Exact contrast ratios for green-100/green-800, amber-100/amber-800, red-100/red-800 not verified with authoritative tools.
   - Recommendation: Before shipping, verify with WebAIM Contrast Checker or automated a11y tests. LOW confidence on exact ratios without tool verification.

4. **Teams Needing Attention Widget Interactivity**
   - What we know: Context mentions "Interactivity (clickable to filter/navigate vs display-only)" as Claude's discretion.
   - What's unclear: Should breakdown bar segments be clickable to filter team list? Or display-only?
   - Recommendation: Make clickable if technically feasible (enhance UX). Each segment click filters team list to that status. If complex, start display-only and iterate.

5. **Icon Size for Status Badges**
   - What we know: Current code uses h-3 (12px) icons. Example patterns suggest h-3.5 (14px) for better visibility. Badge text is text-xs (12px).
   - What's unclear: What's optimal icon size relative to 12px text? 12px (match text) vs 14px (slight emphasis)?
   - Recommendation: Test both. 14px (h-3.5) provides better visual balance and easier click targets. If icons feel too large, stick with 12px (h-3).

## Sources

### Primary (HIGH confidence)

- Lucide accessibility guide: https://lucide.dev/guide/advanced/accessibility - Icon accessibility patterns, visually-hidden text over aria-label
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/ - WCAG 2.1 AA requirements: 4.5:1 normal text, 3:1 large text/UI components
- Tailwind CSS Colors documentation: https://tailwindcss.com/docs/customizing-colors - 11 shade levels (50-950), OKLCH color space, perceptual uniformity
- Radix UI Progress: @radix-ui/react-progress in package.json v1.1.8 - Accessible progress bars with ARIA support

### Secondary (MEDIUM confidence)

- Multi-segment progress bar patterns (WebSearch verified with design systems): 3-7 segments recommended, stacked bar with legend
- Accessible status indicator patterns (WebSearch verified with Section508.gov, W3C): Never color alone, use icon + text + color
- Tailwind shade difference rule (WebSearch verified with US Government standard): 50+ difference = WCAG AA, 70+ = AAA
- FreshBooks progress bar patterns (WebSearch via design inspiration sites): 8px height, rounded, dynamic colors, value outside bar

### Tertiary (LOW confidence - needs verification)

- Specific Tailwind color hex values (green-100/800, amber-100/800, red-100/800): Found via WebSearch but not verified with contrast checker
- Exact contrast ratios for Tailwind combinations: Assumed safe based on shade difference rule, but not tool-verified
- FreshBooks specific design specs: General patterns found, but not official FreshBooks design system documentation

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All libraries already in project (package.json verified), official documentation accessed
- Architecture: HIGH - Patterns based on Lucide, Radix, WCAG official guidelines. Existing code reviewed.
- Pitfalls: HIGH - Based on established accessibility guidelines (W3C, WebAIM, Section508) and common mistakes
- Color combinations: MEDIUM - Tailwind shade difference rule verified, but exact hex ratios not tool-tested
- FreshBooks patterns: MEDIUM - General design patterns found, not official FreshBooks design system

**Research date:** 2026-01-19
**Valid until:** 60 days (stable domain - WCAG standards don't change frequently, Tailwind v4 mature)

**Notes for planner:**

- All required libraries already installed - no dependency changes needed
- Existing components (Badge, Progress) have foundation for enhancements
- Current code already uses some patterns (icon + text, sr-only) - build on existing
- Main work: extend Badge variants, add dynamic Progress colors, create visual breakdown component
- Verify color contrast with automated tools before shipping (WebAIM or axe DevTools)
