/**
 * Integration tests for SpendIntent APIs
 *
 * Tests cover all scenarios for spend intent creation and approval workflows.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prisma } from '@/lib/prisma'

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

import { auth } from '@clerk/nextjs/server'
import { POST as createSpendIntent } from './route'
import { POST as approveSpendIntent } from './[spendIntentId]/approve/route'
import { GET as getApprovalSummary } from './[spendIntentId]/approval-summary/route'

describe('SpendIntent APIs', () => {
  let testTeam: any
  let testUser: any
  let treasurerUser: any
  let signingAuthorityUser1: any
  let signingAuthorityUser2: any
  let parentUser: any
  let testBudget: any
  let testBudgetEnvelope: any
  let whitelistedVendor: any
  let nonWhitelistedVendor: any

  beforeEach(async () => {
    // Clean up test data in correct order to respect foreign key constraints
    // Delete child records before parent records
    await prisma.spendIntentApproval.deleteMany({})
    await prisma.spendIntent.deleteMany({})
    await prisma.vendor.deleteMany({
      where: {
        team: {
          name: { contains: 'Test Team' },
        },
      },
    })
    await prisma.teamSigningAuthority.deleteMany({
      where: {
        team: {
          name: { contains: 'Test Team' },
        },
      },
    })
    // Delete budget_envelopes BEFORE users (budget_envelopes references users via createdBy)
    await prisma.budgetEnvelope.deleteMany({
      where: {
        team: {
          name: { contains: 'Test Team' },
        },
      },
    })
    await prisma.budget.deleteMany({
      where: {
        team: {
          name: { contains: 'Test Team' },
        },
      },
    })
    // Delete users AFTER all records that reference them
    await prisma.user.deleteMany({
      where: {
        team: {
          name: { contains: 'Test Team' },
        },
      },
    })
    await prisma.team.deleteMany({
      where: {
        name: { contains: 'Test Team' },
      },
    })

    // Create test team
    testTeam = await prisma.team.create({
      data: {
        name: 'Test Team for SpendIntent',
        season: '2024-25',
        budgetTotal: 100000,
      },
    })

    // Create test users
    testUser = await prisma.user.create({
      data: {
        clerkId: 'test_user_1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'TREASURER',
        teamId: testTeam.id,
      },
    })

    treasurerUser = await prisma.user.create({
      data: {
        clerkId: 'treasurer_user',
        email: 'treasurer@example.com',
        name: 'Treasurer User',
        role: 'TREASURER',
        teamId: testTeam.id,
      },
    })

    signingAuthorityUser1 = await prisma.user.create({
      data: {
        clerkId: 'signing_authority_1',
        email: 'signer1@example.com',
        name: 'Signing Authority 1',
        role: 'PRESIDENT',
        teamId: testTeam.id,
      },
    })

    signingAuthorityUser2 = await prisma.user.create({
      data: {
        clerkId: 'signing_authority_2',
        email: 'signer2@example.com',
        name: 'Signing Authority 2',
        role: 'BOARD_MEMBER',
        teamId: testTeam.id,
      },
    })

    parentUser = await prisma.user.create({
      data: {
        clerkId: 'parent_user',
        email: 'parent@example.com',
        name: 'Parent User',
        role: 'PARENT',
        teamId: testTeam.id,
      },
    })

    // Create TeamSigningAuthority records with explicit isIndependentParentRep flags
    await prisma.teamSigningAuthority.create({
      data: {
        teamId: testTeam.id,
        userId: treasurerUser.id,
        userType: 'TREASURER',
        appointedDate: new Date(),
        isIndependentParentRep: false, // Treasurer is NOT independent parent rep
      },
    })

    await prisma.teamSigningAuthority.create({
      data: {
        teamId: testTeam.id,
        userId: signingAuthorityUser1.id,
        userType: 'PRESIDENT',
        appointedDate: new Date(),
        isIndependentParentRep: false, // President is NOT independent parent rep
      },
    })

    await prisma.teamSigningAuthority.create({
      data: {
        teamId: testTeam.id,
        userId: signingAuthorityUser2.id,
        userType: 'BOARD_MEMBER',
        appointedDate: new Date(),
        isIndependentParentRep: true, // Board member IS independent parent rep
      },
    })

    // Create test budget
    testBudget = await prisma.budget.create({
      data: {
        teamId: testTeam.id,
        season: '2024-25',
        status: 'APPROVED',
        createdBy: 'test_budget_creator',
      },
    })

    // Create test category
    const testCategory = await prisma.category.create({
      data: {
        teamId: testTeam.id,
        name: 'Ice Rental',
        heading: 'Facilities',
      },
    })

    // Create test budget envelope
    testBudgetEnvelope = await prisma.budgetEnvelope.create({
      data: {
        teamId: testTeam.id,
        budgetId: testBudget.id,
        categoryId: testCategory.id,
        capAmount: 50000,
        createdBy: testUser.id,
      },
    })

    // Create test vendors
    whitelistedVendor = await prisma.vendor.create({
      data: {
        teamId: testTeam.id,
        name: 'Approved Ice Rink',
        isWhitelisted: true,
      },
    })

    nonWhitelistedVendor = await prisma.vendor.create({
      data: {
        teamId: testTeam.id,
        name: 'New Vendor Not Yet Approved',
        isWhitelisted: false,
      },
    })
  })

  describe('createSpendIntent', () => {
    it('should create spend intent with standing authorization (all conditions met)', async () => {
      ;(auth as any).mockResolvedValue({ userId: testUser.clerkId })

      const request = new Request('http://localhost/api/spend-intents', {
        method: 'POST',
        body: JSON.stringify({
          teamId: testTeam.id,
          amountCents: 25000,
          paymentMethod: 'E_TRANSFER',
          vendorId: whitelistedVendor.id, // Whitelisted vendor
          budgetLineItemId: testBudgetEnvelope.id,
        }),
      })

      const response = await createSpendIntent(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.spendIntent.status).toBe('AUTHORIZED')
      expect(data.spendIntent.authorizationType).toBe('STANDING_BUDGET_AUTHORIZATION')
      expect(data.spendIntent.requiresManualApproval).toBe(false)
      expect(data.spendIntent.authorizedAt).toBeTruthy()
      expect(data.authorizationDetails.requiredApprovalsCount).toBe(0)
    })

    it('should create spend intent requiring manual approval (unbudgeted)', async () => {
      ;(auth as any).mockResolvedValue({ userId: testUser.clerkId })

      const request = new Request('http://localhost/api/spend-intents', {
        method: 'POST',
        body: JSON.stringify({
          teamId: testTeam.id,
          amountCents: 10000,
          paymentMethod: 'E_TRANSFER',
          vendorId: whitelistedVendor.id,
          budgetLineItemId: null, // No budget
        }),
      })

      const response = await createSpendIntent(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.spendIntent.status).toBe('AUTHORIZATION_PENDING')
      expect(data.spendIntent.authorizationType).toBe('MANUAL_SIGNER_APPROVAL')
      expect(data.spendIntent.requiresManualApproval).toBe(true)
      expect(data.spendIntent.authorizedAt).toBeNull()
      expect(data.authorizationDetails.requiredApprovalsCount).toBe(2)
      expect(data.authorizationDetails.minIndependentParentRepCount).toBe(1)
      expect(data.authorizationDetails.reason).toContain('no budget line item')
    })

    it('should create spend intent requiring manual approval (unknown vendor)', async () => {
      ;(auth as any).mockResolvedValue({ userId: testUser.clerkId })

      const request = new Request('http://localhost/api/spend-intents', {
        method: 'POST',
        body: JSON.stringify({
          teamId: testTeam.id,
          amountCents: 20000,
          paymentMethod: 'E_TRANSFER',
          vendorName: 'New Vendor Inc', // Unknown vendor (no vendorId)
          budgetLineItemId: testBudgetEnvelope.id,
        }),
      })

      const response = await createSpendIntent(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.spendIntent.status).toBe('AUTHORIZATION_PENDING')
      expect(data.spendIntent.requiresManualApproval).toBe(true)
      expect(data.authorizationDetails.reason).toContain('unknown vendor')
    })

    it('should require manual approval for non-whitelisted vendor (budgeted)', async () => {
      ;(auth as any).mockResolvedValue({ userId: testUser.clerkId })

      const request = new Request('http://localhost/api/spend-intents', {
        method: 'POST',
        body: JSON.stringify({
          teamId: testTeam.id,
          amountCents: 30000,
          paymentMethod: 'E_TRANSFER',
          vendorId: nonWhitelistedVendor.id, // Vendor exists but NOT whitelisted
          budgetLineItemId: testBudgetEnvelope.id, // Budgeted
        }),
      })

      const response = await createSpendIntent(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.spendIntent.status).toBe('AUTHORIZATION_PENDING')
      expect(data.spendIntent.authorizationType).toBe('MANUAL_SIGNER_APPROVAL')
      expect(data.spendIntent.requiresManualApproval).toBe(true)
      expect(data.authorizationDetails.reason).toContain('unknown vendor')
    })

    it('should grant standing authorization for whitelisted vendor (all conditions met)', async () => {
      ;(auth as any).mockResolvedValue({ userId: testUser.clerkId })

      const request = new Request('http://localhost/api/spend-intents', {
        method: 'POST',
        body: JSON.stringify({
          teamId: testTeam.id,
          amountCents: 35000,
          paymentMethod: 'E_TRANSFER',
          vendorId: whitelistedVendor.id, // Whitelisted vendor
          budgetLineItemId: testBudgetEnvelope.id, // Budgeted
        }),
      })

      const response = await createSpendIntent(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.spendIntent.status).toBe('AUTHORIZED')
      expect(data.spendIntent.authorizationType).toBe('STANDING_BUDGET_AUTHORIZATION')
      expect(data.spendIntent.requiresManualApproval).toBe(false)
      expect(data.spendIntent.authorizedAt).toBeTruthy()
    })

    it('should require manual approval when no vendorId provided', async () => {
      ;(auth as any).mockResolvedValue({ userId: testUser.clerkId })

      const request = new Request('http://localhost/api/spend-intents', {
        method: 'POST',
        body: JSON.stringify({
          teamId: testTeam.id,
          amountCents: 18000,
          paymentMethod: 'CHEQUE',
          vendorName: 'Unknown Vendor LLC', // Only vendorName, no vendorId
          budgetLineItemId: testBudgetEnvelope.id,
        }),
      })

      const response = await createSpendIntent(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.spendIntent.status).toBe('AUTHORIZATION_PENDING')
      expect(data.spendIntent.authorizationType).toBe('MANUAL_SIGNER_APPROVAL')
      expect(data.spendIntent.requiresManualApproval).toBe(true)
      expect(data.authorizationDetails.reason).toContain('unknown vendor')
    })

    it('should create spend intent with standing authorization (treasurer creating)', async () => {
      // Note: The treasurer creating a spend intent is allowed if vendor is whitelisted
      // The "treasurer as payee" conflict check is separate and not tested here
      ;(auth as any).mockResolvedValue({ userId: treasurerUser.clerkId })

      const request = new Request('http://localhost/api/spend-intents', {
        method: 'POST',
        body: JSON.stringify({
          teamId: testTeam.id,
          amountCents: 15000,
          paymentMethod: 'E_TRANSFER',
          vendorId: whitelistedVendor.id,
          budgetLineItemId: testBudgetEnvelope.id,
        }),
      })

      const response = await createSpendIntent(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.spendIntent.status).toBe('AUTHORIZED')
      expect(data.spendIntent.authorizationType).toBe('STANDING_BUDGET_AUTHORIZATION')
    })

    it('should reject unauthorized user', async () => {
      ;(auth as any).mockResolvedValue({ userId: null })

      const request = new Request('http://localhost/api/spend-intents', {
        method: 'POST',
        body: JSON.stringify({
          teamId: testTeam.id,
          amountCents: 10000,
          paymentMethod: 'E_TRANSFER',
          vendorId: 'vendor_123',
        }),
      })

      const response = await createSpendIntent(request)
      expect(response.status).toBe(401)
    })
  })

  describe('approveSpendIntent', () => {
    let pendingSpendIntent: any

    beforeEach(async () => {
      // Create a pending spend intent
      pendingSpendIntent = await prisma.spendIntent.create({
        data: {
          teamId: testTeam.id,
          createdByUserId: testUser.id,
          amountCents: 10000,
          paymentMethod: 'E_TRANSFER',
          vendorName: 'Test Vendor',
          authorizationType: 'MANUAL_SIGNER_APPROVAL',
          requiresManualApproval: true,
          status: 'AUTHORIZATION_PENDING',
        },
      })
    })

    it('should allow signing authority to approve', async () => {
      ;(auth as any).mockResolvedValue({ userId: signingAuthorityUser1.clerkId })

      const request = new Request(
        `http://localhost/api/spend-intents/${pendingSpendIntent.id}/approve`,
        {
          method: 'POST',
          body: JSON.stringify({
            note: 'Approved - looks good',
          }),
        }
      )

      const response = await approveSpendIntent(request, {
        params: Promise.resolve({ spendIntentId: pendingSpendIntent.id }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.approval).toBeTruthy()
      expect(data.approval.approverUserId).toBe(signingAuthorityUser1.id)
      expect(data.approvalSummary.approvalsCount).toBe(1)
      expect(data.approvalSummary.isAuthorized).toBe(false) // Not yet authorized (need 2 approvals)
      expect(data.spendIntent.status).toBe('AUTHORIZATION_PENDING')
    })

    it('should authorize spend intent after 2 approvals including 1 independent parent rep', async () => {
      // First approval (president - NOT independent parent rep)
      ;(auth as any).mockResolvedValue({ userId: signingAuthorityUser1.clerkId })

      let request = new Request(
        `http://localhost/api/spend-intents/${pendingSpendIntent.id}/approve`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      )

      let response = await approveSpendIntent(request, {
        params: Promise.resolve({ spendIntentId: pendingSpendIntent.id }),
      })
      let data = await response.json()

      expect(response.status).toBe(200)
      expect(data.approvalSummary.approvalsCount).toBe(1)
      expect(data.approvalSummary.independentParentRepApprovalsCount).toBe(0) // President is NOT independent parent rep
      expect(data.spendIntent.status).toBe('AUTHORIZATION_PENDING')

      // Second approval (board member - IS independent parent rep)
      ;(auth as any).mockResolvedValue({ userId: signingAuthorityUser2.clerkId })

      request = new Request(`http://localhost/api/spend-intents/${pendingSpendIntent.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({}),
      })

      response = await approveSpendIntent(request, {
        params: Promise.resolve({ spendIntentId: pendingSpendIntent.id }),
      })
      data = await response.json()

      expect(response.status).toBe(200)
      expect(data.approvalSummary.approvalsCount).toBe(2)
      expect(data.approvalSummary.independentParentRepApprovalsCount).toBe(1) // Now we have 1 independent parent rep
      expect(data.approvalSummary.isAuthorized).toBe(true)
      expect(data.spendIntent.status).toBe('AUTHORIZED')
      expect(data.spendIntent.authorizedAt).toBeTruthy()
    })

    it('should reject duplicate approval by same user', async () => {
      // First approval
      ;(auth as any).mockResolvedValue({ userId: signingAuthorityUser1.clerkId })

      let request = new Request(
        `http://localhost/api/spend-intents/${pendingSpendIntent.id}/approve`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      )

      await approveSpendIntent(request, {
        params: Promise.resolve({ spendIntentId: pendingSpendIntent.id }),
      })

      // Attempt duplicate approval
      request = new Request(`http://localhost/api/spend-intents/${pendingSpendIntent.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await approveSpendIntent(request, {
        params: Promise.resolve({ spendIntentId: pendingSpendIntent.id }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('already approved')
    })

    it('should reject non-signing-authority user', async () => {
      ;(auth as any).mockResolvedValue({ userId: parentUser.clerkId })

      const request = new Request(
        `http://localhost/api/spend-intents/${pendingSpendIntent.id}/approve`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      )

      const response = await approveSpendIntent(request, {
        params: Promise.resolve({ spendIntentId: pendingSpendIntent.id }),
      })

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('signing authorities')
    })

    it('should remain pending with 2 approvals when neither has isIndependentParentRep', async () => {
      // Create a third signing authority without independent parent rep status
      const signingAuthorityUser3 = await prisma.user.create({
        data: {
          clerkId: 'signing_authority_3',
          email: 'signer3@example.com',
          name: 'Signing Authority 3',
          role: 'ASSISTANT_TREASURER',
          teamId: testTeam.id,
        },
      })

      await prisma.teamSigningAuthority.create({
        data: {
          teamId: testTeam.id,
          userId: signingAuthorityUser3.id,
          userType: 'ASSISTANT_TREASURER',
          appointedDate: new Date(),
          isIndependentParentRep: false, // Explicitly NOT independent parent rep
        },
      })

      // First approval (president - not independent parent rep)
      ;(auth as any).mockResolvedValue({ userId: signingAuthorityUser1.clerkId })

      let request = new Request(
        `http://localhost/api/spend-intents/${pendingSpendIntent.id}/approve`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      )

      await approveSpendIntent(request, {
        params: Promise.resolve({ spendIntentId: pendingSpendIntent.id }),
      })

      // Second approval (assistant treasurer - also not independent parent rep)
      ;(auth as any).mockResolvedValue({ userId: signingAuthorityUser3.clerkId })

      request = new Request(`http://localhost/api/spend-intents/${pendingSpendIntent.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await approveSpendIntent(request, {
        params: Promise.resolve({ spendIntentId: pendingSpendIntent.id }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.approvalSummary.approvalsCount).toBe(2)
      expect(data.approvalSummary.independentParentRepApprovalsCount).toBe(0) // Zero independent parent reps
      expect(data.approvalSummary.isAuthorized).toBe(false) // STILL PENDING - missing independent parent rep
      expect(data.spendIntent.status).toBe('AUTHORIZATION_PENDING')
    })

    it('should NOT count PARENT role if isIndependentParentRep=false', async () => {
      // Create a signing authority with PARENT role but isIndependentParentRep=false
      const parentSignerNotIndependent = await prisma.user.create({
        data: {
          clerkId: 'parent_signer_not_independent',
          email: 'parent_not_independent@example.com',
          name: 'Parent Signer Not Independent',
          role: 'PARENT', // Has PARENT role
          teamId: testTeam.id,
        },
      })

      await prisma.teamSigningAuthority.create({
        data: {
          teamId: testTeam.id,
          userId: parentSignerNotIndependent.id,
          userType: 'PARENT',
          appointedDate: new Date(),
          isIndependentParentRep: false, // Explicitly NOT independent despite PARENT role
        },
      })

      // First approval (president)
      ;(auth as any).mockResolvedValue({ userId: signingAuthorityUser1.clerkId })

      let request = new Request(
        `http://localhost/api/spend-intents/${pendingSpendIntent.id}/approve`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      )

      await approveSpendIntent(request, {
        params: Promise.resolve({ spendIntentId: pendingSpendIntent.id }),
      })

      // Second approval (parent with isIndependentParentRep=false)
      ;(auth as any).mockResolvedValue({ userId: parentSignerNotIndependent.clerkId })

      request = new Request(`http://localhost/api/spend-intents/${pendingSpendIntent.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await approveSpendIntent(request, {
        params: Promise.resolve({ spendIntentId: pendingSpendIntent.id }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.approvalSummary.approvalsCount).toBe(2)
      expect(data.approvalSummary.independentParentRepApprovalsCount).toBe(0) // Does NOT count despite PARENT role
      expect(data.approvalSummary.isAuthorized).toBe(false)
      expect(data.spendIntent.status).toBe('AUTHORIZATION_PENDING')
    })

    it('should snapshot isIndependentParentRep at approval time (historical behavior)', async () => {
      // This test proves that approvals snapshot the isIndependentParentRep value
      // If it changes later in the TeamSigningAuthority record, the approval retains the original value

      // First approval (president - not independent parent rep)
      ;(auth as any).mockResolvedValue({ userId: signingAuthorityUser1.clerkId })

      const request = new Request(
        `http://localhost/api/spend-intents/${pendingSpendIntent.id}/approve`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      )

      const firstApprovalResponse = await approveSpendIntent(request, {
        params: Promise.resolve({ spendIntentId: pendingSpendIntent.id }),
      })
      const firstApprovalData = await firstApprovalResponse.json()

      // Verify the approval was recorded with isIndependentParentRep=false
      expect(firstApprovalData.approval.isIndependentParentRep).toBe(false)

      // Now UPDATE the TeamSigningAuthority record to make user1 an independent parent rep
      await prisma.teamSigningAuthority.updateMany({
        where: {
          teamId: testTeam.id,
          userId: signingAuthorityUser1.id,
          isActive: true,
        },
        data: {
          isIndependentParentRep: true, // Changed to true
        },
      })

      // Fetch the approval again - the snapshot should STILL be false
      const approvalFromDb = await prisma.spendIntentApproval.findFirst({
        where: {
          spendIntentId: pendingSpendIntent.id,
          approverUserId: signingAuthorityUser1.id,
        },
      })

      expect(approvalFromDb?.isIndependentParentRep).toBe(false) // Snapshot preserved original value
    })

    it('should reject approval for spend intent that does not require approval', async () => {
      const authorizedSpendIntent = await prisma.spendIntent.create({
        data: {
          teamId: testTeam.id,
          createdByUserId: testUser.id,
          amountCents: 10000,
          paymentMethod: 'E_TRANSFER',
          vendorId: whitelistedVendor.id,
          budgetLineItemId: testBudgetEnvelope.id,
          authorizationType: 'STANDING_BUDGET_AUTHORIZATION',
          requiresManualApproval: false,
          status: 'AUTHORIZED',
          authorizedAt: new Date(),
        },
      })

      ;(auth as any).mockResolvedValue({ userId: signingAuthorityUser1.clerkId })

      const request = new Request(
        `http://localhost/api/spend-intents/${authorizedSpendIntent.id}/approve`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      )

      const response = await approveSpendIntent(request, {
        params: Promise.resolve({ spendIntentId: authorizedSpendIntent.id }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('does not require manual approval')
    })
  })

  describe('getApprovalSummary', () => {
    let pendingSpendIntent: any

    beforeEach(async () => {
      pendingSpendIntent = await prisma.spendIntent.create({
        data: {
          teamId: testTeam.id,
          createdByUserId: testUser.id,
          amountCents: 10000,
          paymentMethod: 'E_TRANSFER',
          vendorName: 'Test Vendor',
          authorizationType: 'MANUAL_SIGNER_APPROVAL',
          requiresManualApproval: true,
          status: 'AUTHORIZATION_PENDING',
        },
      })
    })

    it('should return approval summary for pending spend intent', async () => {
      ;(auth as any).mockResolvedValue({ userId: testUser.clerkId })

      const request = new Request(
        `http://localhost/api/spend-intents/${pendingSpendIntent.id}/approval-summary`,
        { method: 'GET' }
      )

      const response = await getApprovalSummary(request, {
        params: Promise.resolve({ spendIntentId: pendingSpendIntent.id }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.approvalSummary.approvalsCount).toBe(0)
      expect(data.approvalSummary.requiredApprovalsCount).toBe(2)
      expect(data.approvalSummary.requiredIndependentParentRepCount).toBe(1)
      expect(data.approvalSummary.missing.approvalsRemaining).toBe(2)
      expect(data.approvalSummary.missing.independentParentRepRemaining).toBe(1)
      expect(data.approvalSummary.isAuthorized).toBe(false)
    })

    it('should return approval summary after partial approvals', async () => {
      // Create one approval
      await prisma.spendIntentApproval.create({
        data: {
          spendIntentId: pendingSpendIntent.id,
          approverUserId: signingAuthorityUser1.id,
          isIndependentParentRep: false,
        },
      })

      ;(auth as any).mockResolvedValue({ userId: testUser.clerkId })

      const request = new Request(
        `http://localhost/api/spend-intents/${pendingSpendIntent.id}/approval-summary`,
        { method: 'GET' }
      )

      const response = await getApprovalSummary(request, {
        params: Promise.resolve({ spendIntentId: pendingSpendIntent.id }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.approvalSummary.approvalsCount).toBe(1)
      expect(data.approvalSummary.missing.approvalsRemaining).toBe(1)
      expect(data.approvalSummary.isAuthorized).toBe(false)
      expect(data.approvals).toHaveLength(1)
    })
  })

  describe('Self-Dealing Prevention', () => {
    let treasurerAsPayeeSpendIntent: any

    beforeEach(async () => {
      // Create a spend intent where treasurer is the payee
      treasurerAsPayeeSpendIntent = await prisma.spendIntent.create({
        data: {
          teamId: testTeam.id,
          createdByUserId: testUser.id,
          amountCents: 15000, // $150
          paymentMethod: 'E_TRANSFER',
          vendorName: 'Treasurer Reimbursement',
          payeeUserId: treasurerUser.id, // Treasurer is the payee
          authorizationType: 'MANUAL_SIGNER_APPROVAL',
          requiresManualApproval: true,
          status: 'AUTHORIZATION_PENDING',
        },
      })
    })

    it('should prevent treasurer from approving their own payment', async () => {
      // Treasurer attempts to approve payment to themselves
      ;(auth as any).mockResolvedValue({ userId: treasurerUser.clerkId })

      const request = new Request(
        `http://localhost/api/spend-intents/${treasurerAsPayeeSpendIntent.id}/approve`,
        {
          method: 'POST',
          body: JSON.stringify({
            note: 'Attempting to approve my own payment',
          }),
        }
      )

      const response = await approveSpendIntent(request, {
        params: Promise.resolve({ spendIntentId: treasurerAsPayeeSpendIntent.id }),
      })

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('cannot approve a payment to yourself')
    })

    it('should allow other signing authority to approve treasurer payment', async () => {
      // Another signing authority (not the payee) approves
      ;(auth as any).mockResolvedValue({ userId: signingAuthorityUser1.clerkId })

      const request = new Request(
        `http://localhost/api/spend-intents/${treasurerAsPayeeSpendIntent.id}/approve`,
        {
          method: 'POST',
          body: JSON.stringify({
            note: 'Approving treasurer reimbursement',
          }),
        }
      )

      const response = await approveSpendIntent(request, {
        params: Promise.resolve({ spendIntentId: treasurerAsPayeeSpendIntent.id }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.approval).toBeTruthy()
      expect(data.approval.approverUserId).toBe(signingAuthorityUser1.id)
      expect(data.approvalSummary.approvalsCount).toBe(1)
    })

    it('should require two non-payee approvals for treasurer payment', async () => {
      // First approval by signing authority 1
      ;(auth as any).mockResolvedValue({ userId: signingAuthorityUser1.clerkId })

      let request = new Request(
        `http://localhost/api/spend-intents/${treasurerAsPayeeSpendIntent.id}/approve`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      )

      let response = await approveSpendIntent(request, {
        params: Promise.resolve({ spendIntentId: treasurerAsPayeeSpendIntent.id }),
      })
      expect(response.status).toBe(200)

      // Second approval by signing authority 2 (who is independent parent rep)
      ;(auth as any).mockResolvedValue({ userId: signingAuthorityUser2.clerkId })

      request = new Request(
        `http://localhost/api/spend-intents/${treasurerAsPayeeSpendIntent.id}/approve`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      )

      response = await approveSpendIntent(request, {
        params: Promise.resolve({ spendIntentId: treasurerAsPayeeSpendIntent.id }),
      })

      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.approvalSummary.approvalsCount).toBe(2)
      expect(data.approvalSummary.independentParentRepApprovalsCount).toBe(1)
      expect(data.approvalSummary.isAuthorized).toBe(true)
      expect(data.spendIntent.status).toBe('AUTHORIZED')
    })

    it('should allow approvals when payeeUserId is null', async () => {
      // Create spend intent without payeeUserId
      const normalSpendIntent = await prisma.spendIntent.create({
        data: {
          teamId: testTeam.id,
          createdByUserId: testUser.id,
          amountCents: 10000,
          paymentMethod: 'E_TRANSFER',
          vendorName: 'Regular Vendor',
          payeeUserId: null, // No payee specified
          authorizationType: 'MANUAL_SIGNER_APPROVAL',
          requiresManualApproval: true,
          status: 'AUTHORIZATION_PENDING',
        },
      })

      // Anyone (including treasurer) can approve when no payeeUserId
      ;(auth as any).mockResolvedValue({ userId: treasurerUser.clerkId })

      const request = new Request(
        `http://localhost/api/spend-intents/${normalSpendIntent.id}/approve`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      )

      const response = await approveSpendIntent(request, {
        params: Promise.resolve({ spendIntentId: normalSpendIntent.id }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.approval.approverUserId).toBe(treasurerUser.id)
    })
  })
})
