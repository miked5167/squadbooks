# Transaction Approvals - Archived

## Reason for Archival
These components and files were part of the old approval-based transaction workflow. They have been replaced by the new **validation-first workflow** with the Exceptions Inbox.

## Date Archived
December 17, 2024

## What Was Replaced

### Old Workflow (Approval-Based):
- Transactions required manual approval from treasurers
- Approval/reject buttons on each transaction
- Pending approvals queue
- Manual review of every transaction above threshold

### New Workflow (Validation-First):
- Transactions automatically validated against rules
- Exceptions flagged for review
- Clear violation messages and actionable guidance
- Manual resolution only when needed

## Archived Files

### Pages:
- `pages/approvals/page.tsx` - Main approvals page
- `pages/approvals/page-old.tsx` - Previous version

### Components:
- `components/approvals/ApprovalDetailsDrawer.tsx`
- `components/approvals/ApprovalFiltersToolbar.tsx`
- `components/approvals/ApprovalMobileCard.tsx`
- `components/approvals/ApprovalTable.tsx`
- `components/approvals/BulkActionDialog.tsx`
- `components/approvals/index.ts`

### Library Files:
- `lib/hooks/use-approvals.ts` - React hooks for approvals
- `lib/types/approvals.ts` - TypeScript types
- `lib/db/approvals.ts` - Database queries
- `lib/utils/approval-risk.ts` - Risk calculation utilities

## Replacement Files

### New Exceptions Workflow:
- `app/exceptions/page.tsx` - Exceptions Inbox page
- `components/exceptions/ExceptionDetailsDrawer.tsx`
- `components/exceptions/ExceptionFiltersToolbar.tsx`
- `components/exceptions/ExceptionTable.tsx`
- `lib/hooks/use-exceptions.ts`
- `lib/types/exceptions.ts`
- `lib/services/validation-engine-v1.ts`
- `lib/services/validate-imported-transactions.ts`

## Notes
- Budget approvals (different from transaction approvals) remain active
- Association governance approvals remain active
- The database Approval model may still exist for budget/governance workflows
- These files are kept for reference and potential rollback if needed
