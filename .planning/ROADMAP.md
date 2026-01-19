# Roadmap: Squadbooks

## Milestones

- ✅ **v1.0 Association Transaction Oversight** - Phases 1-4 (shipped 2026-01-19)
- 🚧 **v1.1 Dashboard UX Polish** - Phases 5-6 (in progress)

## Phases

<details>
<summary>✅ v1.0 Association Transaction Oversight (Phases 1-4) - SHIPPED 2026-01-19</summary>

v1.0 delivered association-scoped transaction viewing with advanced filtering, PDF receipt viewing, and defense-in-depth security. Association leaders can now quickly identify teams with missing receipts and verify compliance with spending policies across all teams.

**Execution time:** 18.7 hours across 15 plans
**Performance:** 595ms dashboard load (70% under 2s target for 50 teams/20K transactions)

</details>

### 🚧 v1.1 Dashboard UX Polish (In Progress)

**Milestone Goal:** Apply QuickBooks and FreshBooks design patterns to improve association dashboard visual hierarchy, scannability, and professional polish

#### Phase 5: Design Foundation

**Goal:** Application uses QuickBooks spacing grid and typography hierarchy for consistent visual rhythm and clear information architecture (base component changes affect all pages)

**Depends on:** Phase 4 (v1.0 complete)

**Requirements:** UX-01, UX-02

**Success Criteria** (what must be TRUE):

1. All Card components app-wide use consistent 4px-based spacing (CardHeader space-y-2/8px, card padding p-6/24px, grid gaps gap-4/16px or gap-6/24px)
2. All CardTitle components app-wide follow systematic type scale (18px headings via text-lg default, labels 14px, badges 12px, metrics 30px with appropriate font weights)
3. Information hierarchy is immediately scannable on dashboard, transactions, teams, and settings pages - users can distinguish metrics from labels at a glance
4. Visual rhythm feels professional and matches QuickBooks design polish across entire application
5. No regressions on any pages from base component changes (107 files use Card component)

**Scope Note:** This phase modifies `components/ui/card.tsx` (base component), affecting all pages app-wide. CardTitle text-lg default and CardHeader space-y-2 apply globally for consistent hierarchy. Cross-app verification required.

**Plans:** 2 plans

Plans:

- [x] 05-01-PLAN.md — Apply QuickBooks typography hierarchy and refine 4px spacing grid
- [x] 05-02-PLAN.md — Remove text-base overrides from 4 dashboard components for consistent 18px rendering

#### Phase 6: Component Polish

**Goal:** Status indicators and financial visualizations use industry-standard patterns with accessibility features

**Depends on:** Phase 5

**Requirements:** UX-03, UX-04, UX-05

**Success Criteria** (what must be TRUE):

1. Status badges include both color and icons (CheckCircle/green for healthy, AlertTriangle/amber for warning, AlertOctagon/red for critical) meeting WCAG 2.1 AA contrast requirements
2. Budget progress bars use FreshBooks styling (8px height, rounded, dynamic color thresholds with smooth transitions)
3. Teams Needing Attention widget displays visual breakdown bar showing critical vs warning distribution with numerical counts
4. All status indicators remain usable for users with color vision deficiencies (icons provide redundant signaling)

**Plans:** TBD

Plans:

- [ ] 06-01: TBD

## Progress

**Execution Order:** Phases execute in numeric order: 5 → 6

| Phase                | Milestone | Plans Complete | Status      | Completed  |
| -------------------- | --------- | -------------- | ----------- | ---------- |
| 1. Foundation        | v1.0      | Complete       | Complete    | 2026-01-19 |
| 2. Security          | v1.0      | Complete       | Complete    | 2026-01-19 |
| 3. Features          | v1.0      | Complete       | Complete    | 2026-01-19 |
| 4. Polish            | v1.0      | Complete       | Complete    | 2026-01-19 |
| 5. Design Foundation | v1.1      | 2/2            | Complete    | 2026-01-19 |
| 6. Component Polish  | v1.1      | 0/TBD          | Not started | -          |

---

_Last updated: 2026-01-19 after Phase 5 completion_
