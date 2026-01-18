# Feature Research

**Domain:** Association Financial Oversight Dashboards (Transaction Monitoring & Receipt Verification)
**Researched:** 2026-01-18
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or unusable for oversight.

| Feature                       | Why Expected                                                   | Complexity | Notes                                                    |
| ----------------------------- | -------------------------------------------------------------- | ---------- | -------------------------------------------------------- |
| View all team transactions    | Core oversight requirement - can't monitor without seeing data | LOW        | Already building - permissions-based scoping             |
| Filter by team                | Multi-entity oversight requires isolating specific teams       | LOW        | Critical for association users managing 10-50+ teams     |
| Filter by date range          | Time-based analysis (monthly reviews, season comparisons)      | LOW        | Standard in all financial dashboards                     |
| Filter by missing receipts    | Primary use case - compliance verification                     | LOW        | Combines receipt presence check + amount threshold rules |
| Search transactions           | Find specific vendors or descriptions quickly                  | LOW        | Text search across vendor/description fields             |
| Sort by date/amount           | Common financial analysis pattern                              | LOW        | Standard table sorting functionality                     |
| View receipt images           | Can't verify compliance without seeing receipts                | LOW        | Already have receipt viewer component                    |
| Transaction status indicators | Need to distinguish imported vs validated vs exceptions        | LOW        | Already have status badge system                         |
| Real-time data                | Stale data defeats oversight purpose                           | LOW        | Server Components fetch current data on page load        |
| Association-scoped visibility | Security requirement - Ontario can't see Alberta data          | LOW        | Permission guards already exist                          |
| Pagination/lazy loading       | 100-500+ transactions per association requires performance     | MEDIUM     | Cursor-based pagination already implemented              |
| Export to Excel/CSV           | Board reporting and external audit requirements                | MEDIUM     | Common compliance feature - enables offline analysis     |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature                        | Value Proposition                                        | Complexity | Notes                                                                        |
| ------------------------------ | -------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| Validation badges in list view | See compliance status without drilling down              | LOW        | UI state mapping already exists - just display                               |
| Drill-down from team overview  | Contextual investigation - see team → see transactions   | LOW        | Aligns with existing user flow (dashboard → team page)                       |
| Dedicated cross-team view      | Comparative analysis across all teams at once            | LOW        | Transactions page with team filter                                           |
| Read-only enforcement          | Protects team data ownership while enabling oversight    | LOW        | Permission-based - no edit/delete for association users                      |
| Missing receipt count badges   | Quickly identify non-compliant teams                     | LOW        | Aggregate query + badge display                                              |
| Filter by validation status    | Focus on exceptions vs compliant transactions            | LOW        | Status filter tabs (already planned: imported/validated/exceptions/resolved) |
| Transaction detail drawer      | See full context without page navigation                 | MEDIUM     | Right-side drawer pattern already exists for parents                         |
| Team comparison metrics        | Which teams have highest compliance rates                | MEDIUM     | Aggregation queries + dashboard cards                                        |
| Bulk receipt download          | Download all missing receipt transactions for follow-up  | MEDIUM     | Zip receipts for specific filter criteria                                    |
| Receipt upload date tracking   | See when receipts were added (late compliance detection) | LOW        | Track createdAt for receipt uploads                                          |
| Saved filter presets           | "Missing receipts over $200" - one-click access          | MEDIUM     | Save common filter combinations per user                                     |
| Policy violation highlighting  | Visual indicators for receipt/approval rule violations   | LOW        | Already have exception detection - just surface it                           |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for v1.

| Feature                                | Why Requested                          | Why Problematic                                                                     | Alternative                                               |
| -------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Association users editing transactions | "I see an error, let me fix it"        | Breaks ownership model - team treasurers own their data, association audits it      | View-only with flagging/commenting in v2                  |
| Association users uploading receipts   | "Missing receipt, I have it"           | Same ownership problem - creates confusion about who's responsible                  | Read-only in v1, request feature in v2                    |
| Real-time notifications                | "Alert me when receipt is missing"     | Notification fatigue + complexity - requires email infrastructure, user preferences | Defer to v1.x - focus on dashboard visibility first       |
| Advanced analytics/trends              | "Show me spending patterns over time"  | Scope creep - primary need is compliance verification, not analytics                | Dashboard shows current state, defer trend analysis to v2 |
| Custom receipt validation rules        | "I want OCR to verify amounts"         | OCR complexity + accuracy issues - out of scope per PRD                             | Manual verification in v1, OCR in future                  |
| Commenting on transactions             | "Let me ask team treasurer about this" | Adds communication layer - premature without messaging system                       | Defer to v2 after validating core oversight value         |
| Receipt approval workflows             | "Association must approve receipts"    | Changes approval semantics - currently approval is for expenses, not receipts       | Keep receipt as compliance artifact, not approval target  |
| Multi-association views                | "I'm treasurer for 2 associations"     | Edge case complexity - most users are single association                            | User can switch associations via role selector            |

## Feature Dependencies

```
[View transactions] (base functionality)
    ├──requires──> [Association-scoped visibility] (security)
    ├──requires──> [Pagination] (performance)
    └──enables──> [Filter by team] (multi-entity)
                      └──enables──> [Team comparison metrics]

[Filter by missing receipts]
    ├──requires──> [View transactions]
    └──requires──> [Receipt requirement rules] (already exists)

[Transaction detail drawer]
    ├──requires──> [View transactions]
    ├──enables──> [View receipt images]
    └──enables──> [Download receipt]

[Export to Excel]
    ├──requires──> [View transactions]
    └──requires──> [Filter results] (export what's filtered)

[Drill-down from team page]
    ├──requires──> [View transactions]
    └──enhances──> [Team overview dashboard] (already exists)

[Read-only enforcement]
    ├──requires──> [Permission guards] (already exists)
    └──conflicts──> [Edit/delete transactions] (explicitly prevented)
```

### Dependency Notes

- **View transactions requires Association-scoped visibility:** Security is not optional - must prevent cross-association data leakage from day 1
- **Filter by missing receipts requires Receipt requirement rules:** Leverages existing validation engine - receipt required for expenses >$100 (configurable)
- **Transaction detail drawer enables View receipt images:** Drawer is the UX pattern for detail views (consistency with parent transaction viewing)
- **Export requires Filter results:** Users export what they see - must respect active filters
- **Read-only enforcement conflicts with Edit transactions:** Intentional conflict - association users monitor, team treasurers manage

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the core oversight value proposition.

- [x] **View all team transactions (association-scoped)** — Core requirement, can't do oversight without data visibility
- [x] **Filter by team** — Multi-entity management requires team isolation
- [x] **Filter by date range** — Time-based analysis is fundamental to financial review
- [x] **Filter by missing receipts** — PRIMARY use case per PROJECT.md - "identify teams with missing receipts"
- [x] **Search transactions** — Find specific vendors/descriptions without scrolling
- [x] **Sort by date, amount, category** — Standard financial analysis pattern
- [x] **View receipt images in drawer** — Can't verify compliance without seeing receipts
- [x] **Transaction detail drawer** — See full context (status, validation, metadata) without navigation
- [x] **Association-scoped permissions** — Security requirement - prevent cross-association leakage
- [x] **Read-only enforcement** — Association users observe, team treasurers own
- [x] **Pagination (cursor-based)** — Performance requirement for 100-500+ transactions
- [x] **Validation status badges** — See compliance state at a glance (imported/validated/exception/resolved)

### Add After Validation (v1.x)

Features to add once core oversight is working and validated with users.

- [ ] **Export to Excel/CSV** — Add when users request board reporting capabilities (trigger: 3+ user requests)
- [ ] **Saved filter presets** — Add when users express filter fatigue (trigger: repeated filter patterns in analytics)
- [ ] **Team comparison metrics** — Add when users want comparative analysis (trigger: "which teams are most compliant?")
- [ ] **Missing receipt count badges on team cards** — Add when dashboard needs compliance summary (trigger: users clicking into teams just to count missing receipts)
- [ ] **Bulk receipt download** — Add when users need to share missing receipts externally (trigger: "send this to the board")
- [ ] **Email notifications for missing receipts** — Add when proactive alerts are needed (trigger: users checking dashboard daily for changes)

### Future Consideration (v2+)

Features to defer until product-market fit is established and core value is proven.

- [ ] **Commenting on transactions** — Why defer: Requires messaging infrastructure, adds communication layer complexity
- [ ] **Association users uploading receipts** — Why defer: Changes ownership model, requires permission redesign
- [ ] **Receipt approval workflows** — Why defer: Changes semantic meaning of approvals, adds process complexity
- [ ] **Trend analysis and spending patterns** — Why defer: Analytics are secondary to compliance verification
- [ ] **Custom validation rules** — Why defer: Configuration complexity, most associations use standard thresholds
- [ ] **Receipt OCR/validation** — Why defer: Complex feature, explicitly out of scope per PRD
- [ ] **Multi-association views** — Why defer: Edge case, adds significant complexity for minimal users

## Feature Prioritization Matrix

| Feature                        | User Value | Implementation Cost | Priority | Rationale                                    |
| ------------------------------ | ---------- | ------------------- | -------- | -------------------------------------------- |
| View all transactions (scoped) | HIGH       | LOW                 | P1       | Core requirement - no oversight without data |
| Filter by missing receipts     | HIGH       | LOW                 | P1       | Primary use case per PROJECT.md              |
| Filter by team                 | HIGH       | LOW                 | P1       | Multi-entity management requires isolation   |
| Transaction detail drawer      | HIGH       | LOW                 | P1       | Existing pattern, enables receipt viewing    |
| Search transactions            | HIGH       | LOW                 | P1       | Table stakes for transaction lists           |
| Filter by date range           | HIGH       | LOW                 | P1       | Standard financial analysis requirement      |
| Sort by date/amount            | MEDIUM     | LOW                 | P1       | Expected table functionality                 |
| Read-only enforcement          | HIGH       | LOW                 | P1       | Security/ownership requirement               |
| Validation status badges       | HIGH       | LOW                 | P1       | See compliance at a glance                   |
| Pagination                     | HIGH       | LOW                 | P1       | Performance requirement (100-500+ items)     |
| Export to Excel                | HIGH       | MEDIUM              | P2       | Board reporting, but can defer to v1.x       |
| Team comparison metrics        | MEDIUM     | MEDIUM              | P2       | Nice-to-have, add after validation           |
| Saved filter presets           | MEDIUM     | MEDIUM              | P2       | Convenience feature, not essential           |
| Bulk receipt download          | MEDIUM     | MEDIUM              | P2       | Useful but low frequency use case            |
| Commenting on transactions     | MEDIUM     | HIGH                | P3       | Requires messaging infrastructure            |
| Trend analysis                 | LOW        | HIGH                | P3       | Analytics secondary to compliance            |
| Receipt OCR                    | LOW        | HIGH                | P3       | Out of scope per PRD                         |

**Priority key:**

- P1: Must have for launch (v1)
- P2: Should have, add when validated (v1.x)
- P3: Nice to have, future consideration (v2+)

## Competitor Feature Analysis

| Feature                  | Sports Management Software (SportLoMo, TeamSnap) | Nonprofit Finance (QuickBooks Nonprofit, Araize)  | Our Approach                                                     |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------- | ---------------------------------------------------------------- |
| Multi-entity oversight   | Membership tracking, limited financial oversight | Strong financial controls, limited sports context | Hybrid: Sports-specific + association-level financial oversight  |
| Transaction visibility   | Basic expense tracking at team level             | Full accounting, not sports-optimized             | Read-only oversight for associations, full control for teams     |
| Receipt compliance       | Minimal receipt tracking                         | Receipt storage, no proactive compliance checking | Automated missing receipt detection with filterable views        |
| Drill-down investigation | Limited multi-level hierarchy                    | Account-based, not team-based                     | Team → transactions → receipt (contextual investigation)         |
| Dashboard approach       | Registration/scheduling focus                    | Chart of accounts focus                           | Compliance/oversight focus (missing receipts, validation status) |
| Permission model         | Admin vs member                                  | Accountant vs bookkeeper                          | Association oversight vs team management                         |
| Reporting                | Roster and attendance reports                    | General ledger and P&L                            | Compliance-focused (missing receipts, exceptions)                |

**Our Differentiation:** Read-only financial oversight specifically designed for association leaders monitoring 10-50+ volunteer-run teams. Competitors either do sports management (light finance) or nonprofit accounting (not sports-aware). We bridge the gap.

## UX Best Practices Applied

Based on 2025 research into transaction list and filter UX:

### Filtering Best Practices

- **Display applied filters clearly:** Show active filters as removable chips (e.g., "Team: U13 Red" with X to clear)
- **Include Reset/Clear All:** One-click removal of all filters
- **Show result counts:** Display "Showing X of Y transactions matching filters"
- **Real-time vs batch:** Use real-time filtering for simple filters (status tabs), batch for complex multi-filter (Apply button)
- **Filter placement:** Top filters for quick controls (status, type), sidebar for advanced multi-criteria

### Table UX Best Practices

- **Column sorting:** Click headers to sort (date ↓↑, amount ↓↑)
- **Status indicators:** Color-coded badges for quick scanning (green = validated, red = exception, yellow = pending)
- **Clickable rows:** Entire row opens detail drawer (cursor: pointer on hover)
- **Pagination vs infinite scroll:** Cursor-based "Load More" button (clear end of list, better performance)
- **Mobile responsive:** Stack columns on mobile, prioritize date/vendor/amount/status

### Oversight-Specific Patterns

- **Missing receipt highlighting:** Visual indicator (badge or icon) in list view before drilling down
- **Team context in multi-team view:** Show team name + logo in table when viewing across teams
- **Compliance summary:** Quick stats at top ("12 missing receipts across 3 teams")

## Sources

**Financial Oversight Dashboards:**

- National Council of Nonprofits - Dashboards for Nonprofits (https://www.councilofnonprofits.org/running-nonprofit/administration-and-financial-management/dashboards-nonprofits)
- MetricStream - Compliance Dashboard Guide 2025 (https://www.metricstream.com/learn/compliance-dashboard.html)
- StarCompliance - Financial Compliance Dashboards (https://www.starcompliance.com/three-financial-compliance-dashboards-you-cant-live-without/)
- Explo - Compliance Dashboards Best Practices (https://www.explo.co/blog/compliance-dashboards-compliance-management-reporting)

**Multi-Entity Financial Management:**

- Prelude - Accounting Software for Multiple Entities (https://www.prelude.pro/resources/accounting-software-for-multiple-entities)
- Software Connect - Best Multi-Entity Accounting Software 2025 (https://softwareconnect.com/roundups/best-multi-entity-accounting-software/)
- Reach Reporting - Financial Consolidation Best Practices (https://reachreporting.com/blog/best-practices-for-financial-consolidation-in-multi-entity-accounting)

**Transaction Monitoring:**

- SEON - Transaction Monitoring Software 2025 (https://seon.io/resources/transaction-monitoring-software-how-it-works-and-tips/)
- Focal AI - Top 7 Transaction Monitoring Solutions (https://www.getfocal.ai/blog/transaction-monitoring-software)
- AML Watcher - Complete Guide to Transaction Monitoring 2025 (https://amlwatcher.com/blog/a-complete-guide-to-transaction-monitoring-in-2025/)

**Receipt Compliance:**

- Snipp - 9 Features Every Receipt Validation Platform Must Offer 2025 (https://www.snipp.com/blog/receipt-validation-platform-key-features)
- Emburse - Best Receipt Scanning Apps 2025 (https://www.emburse.com/resources/7-best-receipt-scanning-apps-for-businesses-2025)
- ExpenseVisor - Expense Policy Compliance 2025 (https://expensevisor.com/expense-policy-compliance-in-2025/)

**UX Best Practices:**

- Eleken - 19+ Filter UI Examples for SaaS (https://www.eleken.co/blog-posts/filter-ux-and-ui-for-saas)
- Insaim Design - Filter UI Design Best Practices (https://www.insaim.design/blog/filter-ui-design-best-ux-practices-and-examples)
- Baymard Institute - Product List UX Best Practices 2025 (https://baymard.com/blog/current-state-product-list-and-filtering)
- Pencil & Paper - Enterprise Filtering UX Patterns (https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-filtering)

**Project Context:**

- PROJECT.md - Association Transaction Oversight requirements
- TeamTreasure PRD - Core value proposition and user roles
- Existing codebase - /app/transactions/page.tsx (transaction list), TransactionDetailsDrawer component

---

_Feature research for: Association Financial Oversight Dashboards_
_Researched: 2026-01-18_
_Confidence: HIGH - Based on Context7, official docs, and cross-verified web research_
