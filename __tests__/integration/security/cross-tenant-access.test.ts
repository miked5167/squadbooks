/**
 * Integration tests for cross-tenant security
 *
 * Verifies that association users cannot access other associations' data
 * and that mutation endpoints explicitly reject association users.
 *
 * Tests SEC-01, SEC-02, and SEC-03 requirements.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Test data interfaces
interface TestAssociation {
  id: string
  name: string
  adminUserId: string
  adminClerkId: string
  teamId: string
  treasurerUserId: string
  treasurerClerkId: string
  categoryId: string
  transactionIds: string[]
}

let ontarioAssoc: TestAssociation
let albertaAssoc: TestAssociation

// Mock auth at module level
const mockAuthFn = vi.fn()

vi.mock('@/lib/auth/server-auth', () => ({
  auth: () => mockAuthFn(),
}))

/**
 * Set the mocked user ID for auth
 */
function mockAuth(clerkId: string | null) {
  mockAuthFn.mockResolvedValue({ userId: clerkId })
}

/**
 * Create a mock NextRequest for testing
 */
function createMockRequest(
  method: string,
  url: string,
  body?: any,
  searchParams?: Record<string, string>
): NextRequest {
  const fullUrl = `http://localhost:3000${url}${searchParams ? '?' + new URLSearchParams(searchParams).toString() : ''}`

  return new NextRequest(fullUrl, {
    method,
    ...(body && {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  })
}

describe('Cross-Tenant Security', () => {
  let getTransactions: any
  let postTransaction: any
  let patchTransaction: any
  let deleteTransaction: any
  beforeAll(async () => {
    // Import route handlers after mock is set up
    const transactionsRoute = await import('@/app/api/transactions/route')
    const transactionsIdRoute = await import('@/app/api/transactions/[id]/route')

    getTransactions = transactionsRoute.GET
    postTransaction = transactionsRoute.POST
    patchTransaction = transactionsIdRoute.PATCH
    deleteTransaction = transactionsIdRoute.DELETE

    // Clean up any existing test data
    await prisma.transaction.deleteMany({
      where: {
        OR: [
          { vendor: { contains: 'CROSS_TENANT_TEST' } },
          { description: { contains: 'CROSS_TENANT_TEST' } },
        ],
      },
    })

    // Create Ontario Association
    const ontarioAssociation = await prisma.association.create({
      data: {
        name: 'Ontario Hockey Association TEST',
        slug: 'ontario-test-' + Date.now(),
      },
    })

    const ontarioTeam = await prisma.team.create({
      data: {
        name: 'Ontario Maple Leafs TEST',
        division: 'U13',
        season: '2024-25',
        seasonStartDate: new Date('2024-09-01'),
        seasonEndDate: new Date('2025-06-30'),
      },
    })

    await prisma.associationTeam.create({
      data: {
        associationId: ontarioAssociation.id,
        teamId: ontarioTeam.id,
      },
    })

    const ontarioCategory = await prisma.category.create({
      data: {
        teamId: ontarioTeam.id,
        name: 'Equipment',
        type: 'EXPENSE',
        heading: 'Team Expenses',
      },
    })

    const ontarioAdmin = await prisma.user.create({
      data: {
        clerkId: 'clerk_ontario_admin_' + Date.now(),
        email: 'ontario.admin@test.com',
        name: 'Ontario Admin',
        role: 'ASSOCIATION_ADMIN',
      },
    })

    await prisma.associationUser.create({
      data: {
        userId: ontarioAdmin.id,
        associationId: ontarioAssociation.id,
        role: 'ADMIN',
      },
    })

    const ontarioTreasurer = await prisma.user.create({
      data: {
        clerkId: 'clerk_ontario_treasurer_' + Date.now(),
        email: 'ontario.treasurer@test.com',
        name: 'Ontario Treasurer',
        role: 'TREASURER',
        teamId: ontarioTeam.id,
      },
    })

    const ontarioTx1 = await prisma.transaction.create({
      data: {
        teamId: ontarioTeam.id,
        type: 'EXPENSE',
        amount: 100,
        vendor: 'CROSS_TENANT_TEST Ontario Vendor 1',
        description: 'CROSS_TENANT_TEST Ontario Transaction 1',
        transactionDate: new Date(),
        categoryId: ontarioCategory.id,
        status: 'VALIDATED',
        createdById: ontarioTreasurer.id,
      },
    })

    const ontarioTx2 = await prisma.transaction.create({
      data: {
        teamId: ontarioTeam.id,
        type: 'EXPENSE',
        amount: 200,
        vendor: 'CROSS_TENANT_TEST Ontario Vendor 2',
        description: 'CROSS_TENANT_TEST Ontario Transaction 2',
        transactionDate: new Date(),
        categoryId: ontarioCategory.id,
        status: 'VALIDATED',
        createdById: ontarioTreasurer.id,
      },
    })

    ontarioAssoc = {
      id: ontarioAssociation.id,
      name: ontarioAssociation.name,
      adminUserId: ontarioAdmin.id,
      adminClerkId: ontarioAdmin.clerkId,
      teamId: ontarioTeam.id,
      treasurerUserId: ontarioTreasurer.id,
      treasurerClerkId: ontarioTreasurer.clerkId,
      categoryId: ontarioCategory.id,
      transactionIds: [ontarioTx1.id, ontarioTx2.id],
    }

    // Create Alberta Association
    const albertaAssociation = await prisma.association.create({
      data: {
        name: 'Alberta Hockey Association TEST',
        slug: 'alberta-test-' + Date.now(),
      },
    })

    const albertaTeam = await prisma.team.create({
      data: {
        name: 'Alberta Flames TEST',
        division: 'U13',
        season: '2024-25',
        seasonStartDate: new Date('2024-09-01'),
        seasonEndDate: new Date('2025-06-30'),
      },
    })

    await prisma.associationTeam.create({
      data: {
        associationId: albertaAssociation.id,
        teamId: albertaTeam.id,
      },
    })

    const albertaCategory = await prisma.category.create({
      data: {
        teamId: albertaTeam.id,
        name: 'Equipment',
        type: 'EXPENSE',
        heading: 'Team Expenses',
      },
    })

    const albertaAdmin = await prisma.user.create({
      data: {
        clerkId: 'clerk_alberta_admin_' + Date.now(),
        email: 'alberta.admin@test.com',
        name: 'Alberta Admin',
        role: 'ASSOCIATION_ADMIN',
      },
    })

    await prisma.associationUser.create({
      data: {
        userId: albertaAdmin.id,
        associationId: albertaAssociation.id,
        role: 'ADMIN',
      },
    })

    const albertaTreasurer = await prisma.user.create({
      data: {
        clerkId: 'clerk_alberta_treasurer_' + Date.now(),
        email: 'alberta.treasurer@test.com',
        name: 'Alberta Treasurer',
        role: 'TREASURER',
        teamId: albertaTeam.id,
      },
    })

    const albertaTx1 = await prisma.transaction.create({
      data: {
        teamId: albertaTeam.id,
        type: 'EXPENSE',
        amount: 150,
        vendor: 'CROSS_TENANT_TEST Alberta Vendor 1',
        description: 'CROSS_TENANT_TEST Alberta Transaction 1',
        transactionDate: new Date(),
        categoryId: albertaCategory.id,
        status: 'VALIDATED',
        createdById: albertaTreasurer.id,
      },
    })

    const albertaTx2 = await prisma.transaction.create({
      data: {
        teamId: albertaTeam.id,
        type: 'EXPENSE',
        amount: 250,
        vendor: 'CROSS_TENANT_TEST Alberta Vendor 2',
        description: 'CROSS_TENANT_TEST Alberta Transaction 2',
        transactionDate: new Date(),
        categoryId: albertaCategory.id,
        status: 'VALIDATED',
        createdById: albertaTreasurer.id,
      },
    })

    albertaAssoc = {
      id: albertaAssociation.id,
      name: albertaAssociation.name,
      adminUserId: albertaAdmin.id,
      adminClerkId: albertaAdmin.clerkId,
      teamId: albertaTeam.id,
      treasurerUserId: albertaTreasurer.id,
      treasurerClerkId: albertaTreasurer.clerkId,
      categoryId: albertaCategory.id,
      transactionIds: [albertaTx1.id, albertaTx2.id],
    }
  }, 30000)

  afterAll(async () => {
    // Clean up test data
    await prisma.transaction.deleteMany({
      where: {
        OR: [
          { vendor: { contains: 'CROSS_TENANT_TEST' } },
          { description: { contains: 'CROSS_TENANT_TEST' } },
        ],
      },
    })

    await prisma.associationUser.deleteMany({
      where: {
        OR: [{ associationId: ontarioAssoc.id }, { associationId: albertaAssoc.id }],
      },
    })

    await prisma.user.deleteMany({
      where: {
        OR: [
          { id: ontarioAssoc.adminUserId },
          { id: ontarioAssoc.treasurerUserId },
          { id: albertaAssoc.adminUserId },
          { id: albertaAssoc.treasurerUserId },
        ],
      },
    })

    await prisma.category.deleteMany({
      where: {
        OR: [{ id: ontarioAssoc.categoryId }, { id: albertaAssoc.categoryId }],
      },
    })

    await prisma.associationTeam.deleteMany({
      where: {
        OR: [{ teamId: ontarioAssoc.teamId }, { teamId: albertaAssoc.teamId }],
      },
    })

    await prisma.team.deleteMany({
      where: {
        OR: [{ id: ontarioAssoc.teamId }, { id: albertaAssoc.teamId }],
      },
    })

    await prisma.association.deleteMany({
      where: {
        OR: [{ id: ontarioAssoc.id }, { id: albertaAssoc.id }],
      },
    })
  }, 10000)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Read Operations', () => {
    it('association user can query own teams', async () => {
      mockAuth(ontarioAssoc.adminClerkId)

      const request = createMockRequest('GET', '/api/transactions')
      const response = await getTransactions(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toBeDefined()
      expect(Array.isArray(data.items)).toBe(true)

      // Should include Ontario transactions
      const ontarioTxIds = data.items.map((tx: any) => tx.id)
      expect(ontarioTxIds).toContain(ontarioAssoc.transactionIds[0])
    })

    it('association user cannot query other association teams via teamIds param (SEC-01, SEC-02)', async () => {
      mockAuth(ontarioAssoc.adminClerkId)

      // Try to query Alberta team transactions
      const request = createMockRequest('GET', '/api/transactions', undefined, {
        teamIds: albertaAssoc.teamId,
      })
      const response = await getTransactions(request)

      // Should return 403 or filter out Alberta teams
      if (response.status === 403) {
        const data = await response.json()
        expect(data.error).toContain('No accessible teams')
      } else {
        const data = await response.json()
        expect(data.items).toBeDefined()

        // Should NOT include Alberta transactions
        const txIds = data.items.map((tx: any) => tx.id)
        expect(txIds).not.toContain(albertaAssoc.transactionIds[0])
        expect(txIds).not.toContain(albertaAssoc.transactionIds[1])
      }
    })
  })

  describe('Mutation Operations (SEC-03)', () => {
    it('association user cannot create transaction', async () => {
      mockAuth(ontarioAssoc.adminClerkId)

      const request = createMockRequest('POST', '/api/transactions', {
        type: 'EXPENSE',
        amount: 100,
        vendor: 'Test Vendor',
        description: 'Test Description',
        transactionDate: new Date().toISOString(),
        categoryId: ontarioAssoc.categoryId,
      })

      const response = await postTransaction(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('Association users have read-only access')
    })

    it('association user cannot update transaction', async () => {
      mockAuth(ontarioAssoc.adminClerkId)

      const request = createMockRequest(
        'PATCH',
        `/api/transactions/${ontarioAssoc.transactionIds[0]}`,
        {
          amount: 999,
        }
      )

      const params = Promise.resolve({ id: ontarioAssoc.transactionIds[0] })
      const response = await patchTransaction(request, { params })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('Association users have read-only access')
    })

    it('association user cannot delete transaction', async () => {
      mockAuth(ontarioAssoc.adminClerkId)

      const request = createMockRequest(
        'DELETE',
        `/api/transactions/${ontarioAssoc.transactionIds[0]}`
      )

      const params = Promise.resolve({ id: ontarioAssoc.transactionIds[0] })
      const response = await deleteTransaction(request, { params })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('Association users have read-only access')
    })

    it('team treasurer can still create transaction', async () => {
      mockAuth(ontarioAssoc.treasurerClerkId)

      const request = createMockRequest('POST', '/api/transactions', {
        type: 'EXPENSE',
        amount: 300,
        vendor: 'CROSS_TENANT_TEST Treasurer Created',
        description: 'CROSS_TENANT_TEST Transaction by treasurer',
        transactionDate: new Date().toISOString(),
        categoryId: ontarioAssoc.categoryId,
      })

      const response = await postTransaction(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.transaction).toBeDefined()

      // Clean up the created transaction
      if (data.transaction?.id) {
        await prisma.transaction.delete({
          where: { id: data.transaction.id },
        })
      }
    })
  })

  describe('Multi-Team Query Filtering (SEC-01, SEC-02)', () => {
    it('filters requested team IDs to only accessible teams', async () => {
      mockAuth(ontarioAssoc.adminClerkId)

      // Request both Ontario and Alberta teams
      const request = createMockRequest('GET', '/api/transactions', undefined, {
        teamIds: `${ontarioAssoc.teamId},${albertaAssoc.teamId}`,
      })

      const response = await getTransactions(request)
      const data = await response.json()

      // Should only return Ontario team data
      if (response.status === 200) {
        const txIds = data.items.map((tx: any) => tx.id)

        // Should include Ontario transactions
        expect(txIds).toContain(ontarioAssoc.transactionIds[0])

        // Should NOT include Alberta transactions
        expect(txIds).not.toContain(albertaAssoc.transactionIds[0])
      } else {
        // If 403, it's also acceptable
        expect(response.status).toBe(403)
      }
    })

    it('returns 403 when no accessible teams in request', async () => {
      mockAuth(ontarioAssoc.adminClerkId)

      // Request only Alberta team (not accessible to Ontario admin)
      const request = createMockRequest('GET', '/api/transactions', undefined, {
        teamIds: albertaAssoc.teamId,
      })

      const response = await getTransactions(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('No accessible teams')
    })
  })
})
