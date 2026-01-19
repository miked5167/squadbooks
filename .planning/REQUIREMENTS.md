# Requirements: Association Transaction Oversight

**Defined:** 2026-01-18
**Core Value:** Association leaders can quickly identify teams with missing receipts and verify compliance with spending policies across all teams in their association.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Transaction Viewing

- [ ] **VIEW-01**: Association user can view all transactions from all teams in their association
- [ ] **VIEW-02**: Association user cannot view transactions from other associations (scoped visibility)
- [ ] **VIEW-03**: Association user has read-only access (cannot create, edit, or delete transactions)
- [ ] **VIEW-04**: Transaction list displays key information (date, vendor, amount, category, team, receipt status)
- [ ] **VIEW-05**: Transaction list uses cursor-based pagination for performance with 100-500+ transactions

### Filtering & Search

- [x] **FILTER-01**: Association user can filter transactions by team (multi-select)
- [x] **FILTER-02**: Association user can filter transactions by date range
- [x] **FILTER-03**: Association user can filter transactions by missing receipts (show only transactions without receipts)
- [x] **FILTER-04**: Association user can search transactions by vendor name or description
- [x] **FILTER-05**: Association user can sort transactions by date, amount, or category
- [x] **FILTER-06**: Filter state persists in URL (shareable/bookmarkable filtered views)
- [x] **FILTER-07**: Applied filters display as removable chips above transaction list
- [x] **FILTER-08**: Filter controls show result counts (e.g., "15 transactions")

### Receipt Viewing

- [ ] **RECEIPT-01**: Association user can click transaction to view receipt in right-side drawer
- [x] **RECEIPT-02**: Drawer displays image receipts (JPG/PNG) with zoom/pan
- [x] **RECEIPT-03**: Drawer displays PDF receipts with page navigation
- [x] **RECEIPT-04**: Drawer shows receipt metadata (who uploaded, when uploaded, amount, category)
- [x] **RECEIPT-05**: Association user can download receipt file from drawer
- [ ] **RECEIPT-06**: Drawer shows "No receipt" state for transactions without receipts

### Navigation

- [ ] **NAV-01**: Association user can view team transactions from team details page (contextual investigation)
- [ ] **NAV-02**: Association user can view all association transactions from dedicated transactions page (cross-team analysis)
- [ ] **NAV-03**: Both views use consistent UI components and functionality
- [ ] **NAV-04**: Team details view pre-filters to selected team, retains other filter controls

### Security & Performance

- [x] **SEC-01**: Server-side permission check ensures association user can only access their association's teams
- [x] **SEC-02**: API validates team ownership before returning transaction data
- [x] **SEC-03**: Mutation endpoints explicitly reject requests from association users (403 Forbidden)
- [x] **PERF-01**: Composite database index on (teamId, transactionDate) for association queries
- [x] **PERF-02**: Single batch query for multi-team transactions (no N+1 queries)
- [x] **PERF-03**: Dashboard loads in <2 seconds for 50 teams with 1000 transactions each

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Analysis

- **EXPORT-01**: Association user can export filtered transactions to Excel
- **EXPORT-02**: Association user can export filtered transactions to PDF report
- **PRESET-01**: Association user can save filter presets for quick access
- **PRESET-02**: Association user can share saved filter presets with other association users
- **METRIC-01**: Association user can view team comparison metrics (spending by category, receipt compliance rate)

### Collaboration

- **COMMENT-01**: Association user can add private notes to transactions
- **COMMENT-02**: Association user can request clarification from team treasurer
- **NOTIFY-01**: Association user receives email notification when team has missing receipts >7 days
- **NOTIFY-02**: Association user receives email digest of weekly compliance summary

### Advanced Features

- **BULK-01**: Association user can bulk download receipts for selected transactions
- **ANALYTICS-01**: Association user can view spending trends and anomaly detection
- **AUDIT-01**: Association user can view audit trail of who accessed which transactions

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                                 | Reason                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| Association users editing transactions  | Team treasurers own transaction data; association users provide oversight only |
| Association users uploading receipts    | Team treasurers upload receipts for their own transactions                     |
| Association users deleting transactions | Read-only oversight model; no mutation capabilities                            |
| Real-time notifications                 | Defer to v2; current focus is visibility, not alerting                         |
| Advanced analytics/reporting            | Defer to v2; v1 focuses on raw data access with basic filtering                |
| Receipt OCR/validation                  | Out of scope; manual verification sufficient for oversight                     |
| Mobile app                              | Web-first; responsive design for tablet/desktop, not native mobile             |
| Multi-association view                  | Association users scoped to single association                                 |
| Transaction approval workflow           | Existing budget approval handles this; oversight is post-facto review          |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase   | Status   |
| ----------- | ------- | -------- |
| VIEW-01     | Phase 2 | Complete |
| VIEW-02     | Phase 2 | Complete |
| VIEW-03     | Phase 2 | Complete |
| VIEW-04     | Phase 2 | Complete |
| VIEW-05     | Phase 2 | Complete |
| FILTER-01   | Phase 3 | Complete |
| FILTER-02   | Phase 3 | Complete |
| FILTER-03   | Phase 3 | Complete |
| FILTER-04   | Phase 3 | Complete |
| FILTER-05   | Phase 3 | Complete |
| FILTER-06   | Phase 3 | Complete |
| FILTER-07   | Phase 3 | Complete |
| FILTER-08   | Phase 3 | Complete |
| RECEIPT-01  | Phase 2 | Complete |
| RECEIPT-02  | Phase 3 | Complete |
| RECEIPT-03  | Phase 3 | Complete |
| RECEIPT-04  | Phase 3 | Complete |
| RECEIPT-05  | Phase 3 | Complete |
| RECEIPT-06  | Phase 2 | Complete |
| NAV-01      | Phase 2 | Complete |
| NAV-02      | Phase 2 | Complete |
| NAV-03      | Phase 2 | Complete |
| NAV-04      | Phase 2 | Complete |
| SEC-01      | Phase 1 | Complete |
| SEC-02      | Phase 1 | Complete |
| SEC-03      | Phase 1 | Complete |
| PERF-01     | Phase 1 | Complete |
| PERF-02     | Phase 1 | Complete |
| PERF-03     | Phase 1 | Complete |

**Coverage:**

- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

---

_Requirements defined: 2026-01-18_
_Last updated: 2026-01-18 after roadmap creation_
