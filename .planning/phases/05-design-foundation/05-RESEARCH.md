# Phase 5: Design Foundation - Research

**Researched:** 2026-01-19
**Domain:** Design systems, spacing grids, typography hierarchy for financial dashboards
**Confidence:** MEDIUM

## Summary

Research into QuickBooks design patterns and Tailwind CSS implementation for systematic spacing and typography reveals that the **4px spacing grid** is an industry standard that aligns perfectly with Tailwind's default scale (1 unit = 0.25rem = 4px). QuickBooks uses a comprehensive type scale (12/16, 14/20, 16/24, 18/28, 24/32, 30/40, etc.) with Avenir Next as their primary font, emphasizing simplicity with 3-5 font weights maximum per page and clear visual hierarchy.

The current Squadbooks dashboard already uses Tailwind's 4px-based spacing units but **inconsistently** - mixing `gap-4` (16px) with `gap-6` (24px), `mb-8` (32px) with `mb-1` (4px), and varying card padding approaches. Typography is similarly inconsistent, using `text-xs` through `text-3xl` without a systematic hierarchy tied to element purpose.

**Key risk:** Systematic spacing/typography changes affect visual layout. Without careful execution, cards could expand/contract, breaking grid layouts and creating misalignment. Visual regression testing or meticulous manual verification is critical.

**Primary recommendation:** Audit existing spacing patterns first, document current values, then apply systematic 4px-based spacing and typography scale in phases (KPI cards → Budget cards → Full dashboard) with visual verification between each phase.

## Standard Stack

The established libraries/tools for implementing design foundations in Tailwind CSS applications:

### Core

| Library                  | Version | Purpose                         | Why Standard                                                                      |
| ------------------------ | ------- | ------------------------------- | --------------------------------------------------------------------------------- |
| Tailwind CSS             | 4.1.17  | Utility-first CSS framework     | Already installed, native 4px spacing scale, industry standard for design systems |
| class-variance-authority | 0.7.1   | Component variant management    | Already installed, manages typography/spacing variants systematically             |
| tailwind-merge           | 2.6.0   | Class name merging utility      | Already installed, prevents spacing class conflicts                               |
| @tailwindcss/postcss     | 4.1.17  | Tailwind v4 PostCSS integration | Already installed, modern Tailwind architecture                                   |

### Supporting

| Library                     | Version | Purpose                    | When to Use                                          |
| --------------------------- | ------- | -------------------------- | ---------------------------------------------------- |
| prettier-plugin-tailwindcss | 0.7.2   | Auto-sort Tailwind classes | Already installed, ensures consistent class ordering |
| Visual regression tools     | N/A     | Screenshot comparison      | Optional but recommended for spacing changes         |

### Alternatives Considered

| Instead of        | Could Use               | Tradeoff                                                                 |
| ----------------- | ----------------------- | ------------------------------------------------------------------------ |
| Tailwind defaults | Custom CSS variables    | Would require rewriting existing components, lose utility-first benefits |
| Manual spacing    | Design tokens in config | Good for future but overkill for Phase 5 scope - use defaults first      |
| Class naming      | Styled components       | Complete rewrite, abandons existing shadcn/ui investment                 |

**Installation:**
No new packages required - all dependencies already installed.

## Architecture Patterns

### Current Dashboard Spacing Audit

**Existing patterns observed:**

```tsx
// Card containers - INCONSISTENT
<Card className="border-0 shadow-sm">          // Default padding
<CardHeader className="pb-3">                  // 12px bottom padding
<CardContent className="p-6">                  // 24px all-around padding
<CardContent className="space-y-3">            // 12px vertical spacing
<CardContent className="space-y-4">            // 16px vertical spacing

// Grid layouts - INCONSISTENT
gap-4                                          // 16px (most common)
gap-6                                          // 24px (budget sections)
gap-3                                          // 12px (smaller elements)
gap-2                                          // 8px (badges, icons)

// Section spacing - INCONSISTENT
mb-8                                           // 32px (section breaks)
mb-1                                           // 4px (heading-to-subtitle)
space-y-6                                      // 24px (sidebar widgets)
```

**Typography audit:**

```tsx
// Current usage - NO SYSTEMATIC HIERARCHY
text-3xl font-bold                             // Page title: "Dashboard"
text-base                                      // Subtitle: team name
text-2xl font-bold                             // Metrics: $5,234.56
text-sm                                        // Labels: "Cash Position"
text-xs font-semibold                          // Badges: "Healthy"
text-base font-semibold                        // Card titles
```

### Recommended QuickBooks-Aligned System

**Typography Hierarchy:**

Based on QuickBooks design system research and financial dashboard best practices:

```tsx
// SYSTEMATIC TYPE SCALE (aligned with QuickBooks patterns)

// Badges: 12px/16px (text-xs)
<Badge className="text-xs font-semibold">Healthy</Badge>

// Labels & secondary text: 14px/20px (text-sm)
<span className="text-sm font-medium text-navy/60">Cash Position</span>

// Body text & card subtitles: 16px/24px (text-base)
<p className="text-base text-navy/60">{teamName}</p>

// Card headings: 18px/28px (text-lg)
<CardTitle className="text-lg font-semibold text-navy">Budget Performance</CardTitle>

// Section headings: 24px/32px (text-2xl)
<h2 className="text-2xl font-bold text-navy">Recent Activity</h2>

// Metrics (large numbers): 30px/40px (text-3xl)
<div className="text-3xl font-bold text-navy">$5,234.56</div>

// Page titles: 30px/40px (text-3xl)
<h1 className="text-3xl font-bold text-navy">Dashboard</h1>
```

**Spacing System:**

```tsx
// CARD COMPONENT STANDARD
<Card className="border-0 shadow-sm">
  <CardHeader className="p-6">                 // 24px padding (was pb-3)
    <CardTitle className="text-lg">...</CardTitle>
  </CardHeader>
  <CardContent className="p-6 pt-0">           // 24px sides, 0 top
    {/* Content with internal space-y-4 */}
  </CardContent>
</Card>

// GRID LAYOUTS STANDARD
// KPI cards grid
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
  {/* 16px gaps for related items */}
</div>

// Major section grid
<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
  {/* 24px gaps for distinct sections */}
</div>

// SECTION SPACING STANDARD
<div className="space-y-8">                    // 32px between major sections
  <section>...</section>
  <section>...</section>
</div>

<div className="space-y-6">                    // 24px between related widgets
  <Widget />
  <Widget />
</div>

<div className="space-y-4">                    // 16px within components
  <Item />
  <Item />
</div>
```

### Implementation Pattern: Component-by-Component

**Phase 5 scope focuses on dashboard only** - don't refactor entire application.

```tsx
// STEP 1: Update KpiCard component
// File: components/dashboard/KpiCard.tsx

export function KpiCard({ title, value, subtitle, ... }: KpiCardProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">              // ✓ Already correct
        <div className="flex items-start justify-between mb-4">  // 16px spacing
          <div className="flex items-center gap-2">
            <div className="p-2 bg-navy/5 rounded-lg">
              <Icon className="w-5 h-5 text-navy" />
            </div>
            <span className="text-sm font-medium text-navy/60">{title}</span>  // ✓ Label
          </div>
          {badge && (
            <Badge className="text-xs font-semibold">  // ✓ Badge
              {badge.label}
            </Badge>
          )}
        </div>

        <div className="space-y-1">              // 4px tight spacing
          <div className="text-3xl font-bold text-navy">{value}</div>  // ✓ Metric
          {subtitle && <p className="text-sm text-navy/60">{subtitle}</p>}  // ✓ Label
          {trend && (
            <div className="text-sm">            // ✓ Label size
              <span className="font-medium">{trend.value}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// STEP 2: Update BudgetCategoryList component
// File: components/dashboard/BudgetCategoryList.tsx

export function BudgetCategoryList({ categories }: Props) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="p-6 pb-3">         // 24px padding, 12px bottom
        <CardTitle className="text-lg font-semibold text-navy">  // CHANGE: text-base → text-lg
          Budget Performance
        </CardTitle>
        <p className="text-sm text-navy/60 mt-1">Top spending categories</p>
      </CardHeader>
      <CardContent className="p-6 pt-0">        // CHANGE: no className → p-6 pt-0
        <div className="space-y-4 mb-4">        // 16px between categories
          {topCategories.map((category) => (
            <div key={category.id} className="space-y-2">  // 8px internal
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium text-navy">  // ✓ Label
                  {category.name}
                </span>
                <span className="text-xs text-navy/60">  // ✓ Badge/small label
                  ${category.spent.toLocaleString()} / ${category.budget.toLocaleString()}
                </span>
              </div>
              <Progress value={percentageUsed} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// STEP 3: Update dashboard page layout
// File: app/dashboard/page.tsx

<main className="ml-0 px-4 py-6 pt-20 lg:ml-64 lg:px-8 lg:py-8 lg:pt-8">
  {/* Page Header */}
  <div className="mb-8">                       // 32px spacing after header
    <h1 className="text-3xl font-bold text-navy mb-1">Dashboard</h1>  // ✓ Page title
    <p className="text-base text-navy/60">{teamName}</p>  // CHANGE: text-base (was implicit)
  </div>

  {/* KPI Cards Grid */}
  <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
    {/* ✓ Already correct: gap-4 (16px) */}
  </div>

  {/* Budget + Actions Grid */}
  <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
    {/* ✓ Already correct: gap-6 (24px) */}
    <div className="lg:col-span-8">
      <BudgetCategoryList categories={budgetCategories} />
    </div>

    <div className="space-y-6 lg:col-span-4">  // ✓ Already correct: 24px spacing
      <QuickActionsCard />
      <ValidationComplianceCard />
    </div>
  </div>
</main>
```

### Anti-Patterns to Avoid

**DON'T mix spacing units arbitrarily:**

```tsx
// ❌ BAD - inconsistent spacing breaks visual rhythm
<CardHeader className="pb-3">                  // 12px
<CardContent className="space-y-5">            // 20px (not on 4px grid!)
```

**DON'T change font sizes without considering line height:**

```tsx
// ❌ BAD - tight line height hurts readability
<p className="text-sm leading-tight">Long text that wraps...</p>

// ✓ GOOD - Tailwind's defaults already provide proper line heights
<p className="text-sm">Long text that wraps...</p>  // Automatic 20px line height
```

**DON'T apply typography changes globally without testing:**

```tsx
// ❌ BAD - changing all text-base could break layouts
@layer base {
  * {
    @apply text-lg;  // DON'T DO THIS
  }
}
```

**DON'T skip the audit phase:**

```tsx
// ❌ BAD - blindly applying new spacing without understanding current state
// Could cause cards to overflow, grids to break, alignment issues

// ✓ GOOD - document current spacing, plan changes, verify visually
```

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                    | Don't Build                | Use Instead                                       | Why                                                                      |
| -------------------------- | -------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------ |
| Custom spacing scale       | CSS variables for 4px grid | Tailwind's default spacing                        | Already implements 4px scale, widely understood, autocomplete works      |
| Typography variants        | Custom CSS classes         | `class-variance-authority` (already installed)    | Type-safe variants, composable, already used in badge/button components  |
| Spacing consistency checks | Manual review              | `prettier-plugin-tailwindcss` (already installed) | Auto-sorts classes, catches duplicates, enforces order                   |
| Visual regression testing  | Manual screenshots         | Percy, Chromatic, or Playwright visual comparison | Automated screenshot diffs, CI integration, prevents spacing regressions |
| Design tokens              | Custom config complexity   | Tailwind defaults first, extend only if needed    | Tailwind's defaults align with QuickBooks patterns, less maintenance     |

**Key insight:** Tailwind CSS was designed specifically for 4px-based design systems. Its default spacing scale (0.25rem units) maps directly to QuickBooks' 4px grid. The framework's typography defaults also align with financial dashboard best practices (text-sm = 14px/20px, text-lg = 18px/28px, text-3xl = 30px/36px). Don't rebuild what Tailwind already provides.

## Common Pitfalls

### Pitfall 1: Spacing Changes Break Grid Layouts

**What goes wrong:** Changing card padding from `pb-3` (12px) to `p-6` (24px) increases card height, causing grid columns to misalign or overflow containers.

**Why it happens:** Tailwind utilities are composable - `p-6` sets all sides to 24px, overriding previous padding. When cards in a grid have different heights, flexbox/grid alignment can break.

**How to avoid:**

- Document current card heights before changes
- Test responsive breakpoints (mobile, tablet, desktop)
- Verify `gap-*` values accommodate new card sizes
- Use browser DevTools to measure before/after dimensions

**Warning signs:**

- Cards in same row have different bottom alignment
- Scrollbars appear where they didn't before
- Content cuts off at mobile breakpoints
- Grid items wrap unexpectedly

### Pitfall 2: Typography Changes Cause Text Overflow

**What goes wrong:** Changing `text-base` (16px) to `text-lg` (18px) in constrained spaces (badges, table cells, card headers) causes text to wrap or overflow.

**Why it happens:** Larger font sizes require more horizontal/vertical space. Tailwind's automatic line heights compound this (text-lg uses 28px line height vs text-base's 24px).

**How to avoid:**

- Test with longest expected text strings
- Verify line clamping (`line-clamp-*`) still works
- Check mobile breakpoints where space is limited
- Use `truncate` or `overflow-hidden` where appropriate

**Warning signs:**

- Text wraps to 2 lines where it was 1 line
- Badge text gets cut off
- Table column headers overlap
- Card titles push other content down

### Pitfall 3: Inconsistent Spacing After Partial Migration

**What goes wrong:** Updating some components but not others creates visual inconsistency - KPI cards use `gap-4` but budget cards still use `gap-3`, breaking rhythm.

**Why it happens:** Phase 5 focuses on dashboard only, but dashboard has many components. Partially updating creates a "mixed" state that's visually jarring.

**How to avoid:**

- Complete updates by component type (all KPI cards, then all budget cards)
- Document which components are updated in implementation plan
- Use feature flags or branches to deploy all changes together
- Create a checklist of dashboard components to update

**Warning signs:**

- Some sections feel "tight" while others feel "spacious"
- Visual rhythm feels inconsistent when scrolling
- Designers notice alignment issues between sections
- Components don't "feel" like they belong together

### Pitfall 4: Forgetting Loading/Error States

**What goes wrong:** Update dashboard page typography/spacing but forget to update `loading.tsx` and error states, causing layout shift when loading completes.

**Why it happens:** Loading skeletons and error states are separate components that mirror the main content structure. Easy to overlook during refactoring.

**How to avoid:**

- Update loading states immediately after component changes
- Verify error states match new spacing
- Test with slow network (DevTools throttling)
- Check empty states (no data scenarios)

**Warning signs:**

- Layout "jumps" when loading finishes
- Skeletons don't match final content size
- Error cards have different padding than regular cards
- Empty state typography doesn't match populated state

### Pitfall 5: Over-Applying Spacing Changes Beyond Scope

**What goes wrong:** Phase 5 focuses on dashboard, but developer also updates transactions page, teams page, etc., expanding scope and introducing bugs.

**Why it happens:** Once you start applying systematic spacing, it's tempting to "fix" everything. This violates phase boundaries and risks regressions.

**How to avoid:**

- Stick to stated scope: "dashboard only"
- Create follow-up tasks for other pages
- Resist temptation to "improve while you're there"
- Review changes against requirements (UX-01, UX-02)

**Warning signs:**

- Pull request touches files outside `app/dashboard` and `components/dashboard`
- Changes affect shared components used across app (Button, Card base definitions)
- QA reports issues on pages not in scope
- Testing surface area expands beyond dashboard

## Code Examples

Verified patterns from official sources and current codebase:

### Tailwind Spacing Scale (4px Grid)

```tsx
// Source: https://tailwindcss.com/docs/customizing-spacing
// Tailwind's default spacing scale (1 unit = 0.25rem = 4px)

gap - 1 // 4px   - Tight spacing for icons and badges
gap - 2 // 8px   - Minimal spacing within elements
gap - 3 // 12px  - Not recommended (use gap-4 instead)
gap - 4 // 16px  - Standard spacing for related items  ✓
gap - 6 // 24px  - Spacing for distinct sections       ✓
gap - 8 // 32px  - Major section breaks                ✓

p - 6 // 24px  - Card padding standard               ✓
p - 4 // 16px  - Compact card padding
p - 3 // 12px  - Avoid (not on QuickBooks grid)

mb - 1 // 4px   - Tight spacing (heading-to-subtitle)
mb - 4 // 16px  - Standard paragraph spacing
mb - 8 // 32px  - Section breaks                      ✓

space - y - 4 // 16px  - Within-component spacing            ✓
space - y - 6 // 24px  - Between-widget spacing              ✓
space - y - 8 // 32px  - Between-section spacing             ✓
```

### QuickBooks-Aligned Typography

```tsx
// Source: Financial dashboard best practices research
// Type scale: 12px badges, 14px labels, 18px headings, 30px metrics

// Badges (12px/16px)
<Badge variant="success" className="text-xs font-semibold">
  Healthy
</Badge>

// Labels & secondary text (14px/20px)
<span className="text-sm font-medium text-navy/60">
  Cash Position
</span>

// Card headings (18px/28px)
<CardTitle className="text-lg font-semibold text-navy">
  Budget Performance
</CardTitle>

// Large metrics (30px/36px)
<div className="text-3xl font-bold text-navy">
  ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
</div>

// Secondary metrics (16px/24px)
<p className="text-base text-navy/60">
  of ${budget.toLocaleString()} budgeted
</p>
```

### KPI Card Component (Reference Implementation)

```tsx
// Source: components/dashboard/KpiCard.tsx (current codebase)
// Shows correct spacing patterns already in use

export function KpiCard({ title, value, subtitle, icon: Icon, trend, badge }: KpiCardProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        {' '}
        // ✓ 24px padding
        <div className="mb-4 flex items-start justify-between">
          {' '}
          // ✓ 16px spacing
          <div className="flex items-center gap-2">
            {' '}
            // ✓ 8px icon-to-text
            <div className="bg-navy/5 rounded-lg p-2">
              {' '}
              // ✓ 8px icon padding
              <Icon className="text-navy h-5 w-5" />
            </div>
            <span className="text-navy/60 text-sm font-medium">{title}</span>
            {/* ↑ CORRECT: 14px labels */}
          </div>
          {badge && (
            <Badge variant={badge.variant} className="text-xs font-semibold">
              {/* ↑ CORRECT: 12px badges */}
              {badge.label}
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          {' '}
          // ✓ 4px tight spacing
          <div className="text-navy text-3xl font-bold">{value}</div>
          {/* ↑ CORRECT: 30px metrics */}
          {subtitle && <p className="text-navy/60 text-sm">{subtitle}</p>}
          {/* ↑ CORRECT: 14px labels */}
          {trend && (
            <div className="text-sm">
              <span className="font-medium">{trend.value}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ANALYSIS: KpiCard already follows QuickBooks patterns!
// Only changes needed: ensure text-sm/text-xs/text-3xl are explicit (not inherited)
```

### Card Component Base Patterns

```tsx
// Source: components/ui/card.tsx (current codebase)

// Current implementation - MOSTLY CORRECT
const CardHeader = React.forwardRef<HTMLDivElement, ...>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      //                            ↑ 6px    ↑ 24px
      //                         CHANGE: space-y-1.5 → space-y-2 (8px is more readable)
      {...props}
    />
  )
)

const CardContent = React.forwardRef<HTMLDivElement, ...>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
    //                             ↑ 24px padding, 0 top (prevents double padding)
    //                          CORRECT: This is the standard pattern
  )
)

// RECOMMENDATION:
// Update CardHeader to use space-y-2 (8px) instead of space-y-1.5 (6px)
// This aligns better with 4px grid (1.5 = 6px is not a clean multiple)
```

### Dashboard Grid Layout Pattern

```tsx
// Source: app/dashboard/page.tsx (current codebase)

<main className="ml-0 px-4 py-6 pt-20 lg:ml-64 lg:px-8 lg:py-8 lg:pt-8">
  {/* Page Header */}
  <div className="mb-8">                       // ✓ 32px spacing
    <h1 className="text-3xl font-bold text-navy mb-1">Dashboard</h1>  // ✓ 30px title
    <p className="text-base text-navy/60">{user.team?.name}</p>  // ✓ 16px subtitle
  </div>

  {/* KPI Cards - 4 columns on desktop */}
  <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
    {/* ✓ CORRECT: gap-4 (16px) for related metrics */}
    <KpiCard ... />
    <KpiCard ... />
    <KpiCard ... />
    <KpiCard ... />
  </div>

  {/* Budget Performance + Sidebar - Asymmetric 8/4 split */}
  <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
    {/* ✓ CORRECT: gap-6 (24px) for distinct sections */}

    <div className="lg:col-span-8">
      <BudgetCategoryList categories={budgetCategories} />
    </div>

    <div className="space-y-6 lg:col-span-4">  // ✓ 24px between widgets
      <QuickActionsCard isTreasurer={isTreasurer} />
      <ValidationComplianceCard teamId={user.teamId} />
      {exceptionsCount > 0 && <ExceptionsCard count={exceptionsCount} />}
    </div>
  </div>

  {/* Recent Transactions - Full width */}
  <DashboardContent transactions={formattedTransactions} />
</div>

// ANALYSIS: Layout spacing already follows 4px grid correctly!
// Main changes needed are in TYPOGRAPHY (text sizes), not spacing
```

### Progress Bar Styling (For Phase 6 Reference)

```tsx
// Source: components/ui/progress.tsx (current codebase)
// Note: Phase 6 will enhance this, but documenting current state

const Progress = React.forwardRef<...>(
  ({ className, value, indicatorClassName, ...props }, ref) => (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
        //        ↑ 8px height - CORRECT for QuickBooks pattern
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 bg-primary transition-all", indicatorClassName)}
        //                                                ↑ transition-all is good
        //                                             Phase 6 will add duration-300
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
)

// ANALYSIS: Progress bar height (h-2 = 8px) already matches QuickBooks/FreshBooks patterns
// Phase 6 will add:
// - Dynamic color thresholds (<75% green, 75-90% amber, >90% red)
// - Explicit transition duration (duration-300)
// - Rounded-full container styling (already present!)
```

## State of the Art

| Old Approach                  | Current Approach                               | When Changed                       | Impact                                                 |
| ----------------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| Custom CSS spacing scale      | Tailwind utility classes with 4px grid         | Tailwind v2+ (2020)                | Industry standard, eliminates custom spacing decisions |
| Pixel-based font sizes        | Rem-based with semantic sizing                 | Modern CSS (2018+)                 | Better accessibility, respects user preferences        |
| Manual class ordering         | Prettier plugin auto-sorting                   | prettier-plugin-tailwindcss (2022) | Prevents class conflicts, enforces consistency         |
| Fixed card padding            | Responsive padding utilities (px-4 lg:px-8)    | Tailwind v3+ (2021)                | Better mobile experience, less custom CSS              |
| Linear type scale (1.2 ratio) | Curated type scale (specific sizes)            | Design systems era (2019+)         | Better hierarchy, fewer sizes to choose from           |
| Global CSS resets             | Tailwind Preflight + component styles          | Tailwind v2+ (2020)                | Less CSS conflicts, better component isolation         |
| Custom breakpoint names       | Tailwind standard breakpoints (sm, md, lg, xl) | Industry standard                  | Better collaboration, widely understood                |

**Deprecated/outdated:**

- **Tailwind v3 JIT mode**: Now default in v4 (installed version 4.1.17) - JIT compilation is automatic
- **@apply in components**: Modern approach uses class-variance-authority for variants instead of @apply directives
- **PurgeCSS configuration**: Tailwind v4 handles unused CSS removal automatically
- **tailwind.config.js**: Tailwind v4 can use `@import "tailwindcss"` in CSS instead of config file for simpler projects

## Open Questions

Things that couldn't be fully resolved:

1. **QuickBooks exact font stack**
   - What we know: QuickBooks uses "Avenir Next for Intuit" (proprietary font)
   - What's unclear: Exact fallback chain, whether web font or system font
   - Recommendation: Continue using current font stack (likely Inter or system-ui based on shadcn/ui defaults), focus on size/weight hierarchy rather than font family

2. **Visual regression testing approach**
   - What we know: Percy, Chromatic, and Playwright visual comparison are industry standard tools
   - What's unclear: Whether team has budget/time for automated visual regression setup in Phase 5
   - Recommendation: Manual verification with before/after screenshots for Phase 5, consider automated tools for future phases if regressions become problem

3. **Association dashboard spacing**
   - What we know: Phase 5 focuses on team dashboard only (app/dashboard/page.tsx)
   - What's unclear: Whether association dashboard uses same components or has different spacing patterns
   - Recommendation: Document association dashboard spacing in separate audit, plan Phase 6+ to handle association views if different

4. **Mobile breakpoint spacing adjustments**
   - What we know: Current dashboard uses responsive padding (px-4 lg:px-8) in main container
   - What's unclear: Whether card padding should also be responsive (p-4 on mobile, p-6 on desktop)
   - Recommendation: Test dashboard on mobile (320px width) after changes, adjust if cards feel cramped, prioritize desktop experience for Phase 5 (association users likely on desktop)

5. **Badge icon sizing**
   - What we know: Phase 6 will add icons to badges (CheckCircle, AlertTriangle, AlertOctagon)
   - What's unclear: Whether icons should be 12px (match text-xs) or 14px (slightly larger for visibility)
   - Recommendation: Research during Phase 6, QuickBooks examples may show icons slightly larger than text for better tap targets

## Sources

### Primary (HIGH confidence)

- **Tailwind CSS Official Documentation** - https://tailwindcss.com/docs/font-size, https://tailwindcss.com/docs/gap, https://tailwindcss.com/docs/customizing-spacing
  - Verified: Font size defaults (text-xs = 12px, text-sm = 14px, text-lg = 18px, text-3xl = 30px)
  - Verified: Spacing scale (1 unit = 0.25rem = 4px)
  - Verified: Gap vs space utilities behavior
- **Squadbooks Codebase Audit** - components/dashboard/KpiCard.tsx, components/ui/card.tsx, app/dashboard/page.tsx
  - Verified: Current spacing patterns (p-6, gap-4, gap-6, mb-8, space-y-6)
  - Verified: Current typography usage (text-xs through text-3xl)
  - Verified: Card component structure and defaults

### Secondary (MEDIUM confidence)

- **QuickBooks Design System** - https://design.intuit.com/quickbooks/brand/design-foundations/type/
  - Verified: 4px grid system requirement
  - Verified: Typography measured by bounding box
  - Verified: Type scale includes 12/16, 14/20, 16/24, 18/28, 24/32, 30/40+ sizes
  - Verified: Avenir Next font family, 3-5 weights maximum per page
  - Note: Specific pixel values shown in images, not extracted as text
- **Financial Dashboard Best Practices (2025)** - Multiple sources: UXPin, Julius AI, Datafloq, Phoenix Strategy Group
  - Verified: Large/bold fonts for headings and KPIs, smaller/lighter for secondary info
  - Verified: Maintain 2px minimum difference between text sizes
  - Verified: Limit to 3-4 text size levels to avoid clutter
  - Verified: Sans-serif fonts preferred, no more than 2-3 fonts total
  - Note: General principles, not QuickBooks-specific
- **Design System Migration Strategies (2025)** - Medium, Design Systems Collective
  - Verified: Component-by-component migration approach
  - Verified: Design tokens/variables are modern standard
  - Verified: Major releases for foundational changes, regular releases for enhancements
  - Note: General migration advice, not Tailwind-specific

### Tertiary (LOW confidence)

- **QuickBooks Dashboard Examples (2025)** - coefficient.io, coupler.io
  - Observation: QuickBooks dashboards emphasize simplicity, clear hierarchy, consolidated views
  - Observation: Real-time data integration, customizable layouts
  - Limitation: Marketing content, not technical design system documentation
  - Recommendation: Use for inspiration, not specific implementation guidance
- **Visual Regression Testing Tools (2025)** - BrowserStack, Medium, Argos
  - Observation: Modern tools detect layout issues, spacing changes, typography deviations
  - Observation: AI-powered diff sensitivity (>2px padding changes, >5% color shifts)
  - Limitation: Tool-specific features, not implementation guidance for Phase 5
  - Recommendation: Consider for future phases, not critical for Phase 5 manual verification

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All dependencies already installed, Tailwind documentation authoritative
- Architecture: MEDIUM - QuickBooks design system accessible but some details in images, financial dashboard best practices are general principles not QuickBooks-specific
- Pitfalls: MEDIUM - Based on general design system migration experience and Tailwind best practices, not Squadbooks-specific historical issues

**Research limitations:**

- Could not access full QuickBooks Design System (Bolt) documentation - site redirects to sunset notice
- QuickBooks type scale pixel values inferred from search results and images, not extracted as structured data
- No access to QuickBooks Figma files or design tokens
- Association dashboard not audited (out of Phase 5 scope)

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - design systems are relatively stable, Tailwind v4 is current major version)
