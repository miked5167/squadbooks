-- Update all REVISION budget approvals to INITIAL
UPDATE "budget_approvals"
SET "approvalType" = 'INITIAL'
WHERE "approvalType" = 'REVISION';

-- Verify the change
SELECT "id", "approvalType", "description", "createdAt"
FROM "budget_approvals"
ORDER BY "createdAt" DESC
LIMIT 10;
