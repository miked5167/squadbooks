/**
 * Unit tests for Cheque Issuance API
 *
 * Tests cover all validation rules and preconditions for issuing cheques.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

import { auth } from '@clerk/nextjs/server'
import { POST as issueCheque } from './route'

describe('Cheque Issuance API', () => {
  let testTeam: any
  let treasurerUser: any
  let testVendor: any
  let testSettings: any
  let authorizedSpendIntent: any
  let etransferSpendIntent: any
  let unauthorizedSpendIntent: any

  beforeEach(async () => {
    // Clean up test data
    await prisma.chequeMetadata.deleteMany({})
    await prisma.spendIntentApproval.deleteMany({})
    await prisma.spendIntent.deleteMany({})
    await prisma.vendor.deleteMany({
      where: {
        team: {
          name: { contains: 'Cheque Test Team' },
        },
      },
    })
    await prisma.teamSettings.deleteMany({
      where: {
        team: {
          name: { contains: 'Cheque Test Team' },
        },
      },
    })
    await prisma.user.deleteMany({
      where: {
        team: {
          name: { contains: 'Cheque Test Team' },
        },
      },
    })
    await prisma.team.deleteMany({
      where: {
        name: { contains: 'Cheque Test Team' },
      },
    })

    // Create test team
    testTeam = await prisma.team.create({
      data: {
        name: 'Cheque Test Team',
        season: '2024-25',
        budgetTotal: 100000,
      },
    })

    // Create team settings with threshold
    testSettings = await prisma.teamSettings.create({
      data: {
        teamId: testTeam.id,
        requireChequeImageThresholdCents: 50000, // $500
      },
    })

    // Create treasurer user
    treasurerUser = await prisma.user.create({
      data: {
        clerkId: 'treasurer_cheque_test',
        email: 'treasurer@chequetest.com',
        name: 'Treasurer User',
        role: 'TREASURER',
        teamId: testTeam.id,
      },
    })

    // Create test vendor
    testVendor = await prisma.vendor.create({
      data: {
        teamId: testTeam.id,
        name: 'Test Vendor',
        isWhitelisted: true,
      },
    })

    // Create AUTHORIZED cheque spend intent (low amount, no image required)
    authorizedSpendIntent = await prisma.spendIntent.create({
      data: {
        teamId: testTeam.id,
        createdByUserId: treasurerUser.id,
        amountCents: 20000, // $200 - below threshold
        currency: 'CAD',
        vendorId: testVendor.id,
        paymentMethod: 'CHEQUE',
        authorizationType: 'STANDING_BUDGET_AUTHORIZATION',
        requiresManualApproval: false,
        status: 'AUTHORIZED',
        authorizedAt: new Date(),
      },
    })

    // Create E_TRANSFER spend intent (to test wrong payment method)
    etransferSpendIntent = await prisma.spendIntent.create({
      data: {
        teamId: testTeam.id,
        createdByUserId: treasurerUser.id,
        amountCents: 10000,
        currency: 'CAD',
        vendorId: testVendor.id,
        paymentMethod: 'E_TRANSFER',
        authorizationType: 'STANDING_BUDGET_AUTHORIZATION',
        requiresManualApproval: false,
        status: 'AUTHORIZED',
        authorizedAt: new Date(),
      },
    })

    // Create AUTHORIZATION_PENDING spend intent (not authorized yet)
    unauthorizedSpendIntent = await prisma.spendIntent.create({
      data: {
        teamId: testTeam.id,
        createdByUserId: treasurerUser.id,
        amountCents: 30000,
        currency: 'CAD',
        vendorId: testVendor.id,
        paymentMethod: 'CHEQUE',
        authorizationType: 'MANUAL_SIGNER_APPROVAL',
        requiresManualApproval: true,
        status: 'AUTHORIZATION_PENDING',
      },
    })
  })

  it('should successfully issue a cheque with two signers and transition to OUTSTANDING', async () => {
    // Mock auth
    vi.mocked(auth).mockResolvedValue({ userId: 'treasurer_cheque_test' } as any)

    const request = new NextRequest('http://localhost:3000/api/spend-intents/test/issue-cheque', {
      method: 'POST',
      body: JSON.stringify({
        chequeNumber: 'CHQ-001',
        signer1UserId: treasurerUser.id,
        signer2Name: 'John Smith',
        note: 'Test cheque issuance',
      }),
    })

    const params = Promise.resolve({ spendIntentId: authorizedSpendIntent.id })
    const response = await issueCheque(request, { params })

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.spendIntent.status).toBe('OUTSTANDING')
    expect(data.chequeMetadata).toBeDefined()
    expect(data.chequeMetadata.chequeNumber).toBe('CHQ-001')
    expect(data.chequeMetadata.signer1UserId).toBe(treasurerUser.id)
    expect(data.chequeMetadata.signer2Name).toBe('John Smith')
    expect(data.chequeMetadata.attestedByUserId).toBe(treasurerUser.id)
    expect(data.nextStep).toBe('Awaiting bank settlement (Plaid) and/or reviewer')
  })

  it('should reject if signer2 is missing', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'treasurer_cheque_test' } as any)

    const request = new NextRequest('http://localhost:3000/api/spend-intents/test/issue-cheque', {
      method: 'POST',
      body: JSON.stringify({
        chequeNumber: 'CHQ-002',
        signer1Name: 'Alice Johnson',
        // Missing signer2
      }),
    })

    const params = Promise.resolve({ spendIntentId: authorizedSpendIntent.id })
    const response = await issueCheque(request, { params })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('signer2')
  })

  it('should reject if payment method is not CHEQUE', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'treasurer_cheque_test' } as any)

    const request = new NextRequest('http://localhost:3000/api/spend-intents/test/issue-cheque', {
      method: 'POST',
      body: JSON.stringify({
        chequeNumber: 'CHQ-003',
        signer1Name: 'Alice Johnson',
        signer2Name: 'Bob Smith',
      }),
    })

    const params = Promise.resolve({ spendIntentId: etransferSpendIntent.id })
    const response = await issueCheque(request, { params })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Payment method must be CHEQUE')
  })

  it('should reject if spend intent is not AUTHORIZED', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'treasurer_cheque_test' } as any)

    const request = new NextRequest('http://localhost:3000/api/spend-intents/test/issue-cheque', {
      method: 'POST',
      body: JSON.stringify({
        chequeNumber: 'CHQ-004',
        signer1Name: 'Alice Johnson',
        signer2Name: 'Bob Smith',
      }),
    })

    const params = Promise.resolve({ spendIntentId: unauthorizedSpendIntent.id })
    const response = await issueCheque(request, { params })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('must be AUTHORIZED')
    expect(data.currentStatus).toBe('AUTHORIZATION_PENDING')
  })

  it('should reject duplicate issuance attempt', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'treasurer_cheque_test' } as any)

    // First issuance
    const request1 = new NextRequest('http://localhost:3000/api/spend-intents/test/issue-cheque', {
      method: 'POST',
      body: JSON.stringify({
        chequeNumber: 'CHQ-005',
        signer1Name: 'Alice Johnson',
        signer2Name: 'Bob Smith',
      }),
    })

    const params1 = Promise.resolve({ spendIntentId: authorizedSpendIntent.id })
    const response1 = await issueCheque(request1, { params: params1 })
    expect(response1.status).toBe(200)

    // Verify status changed to OUTSTANDING
    const updatedSpendIntent = await prisma.spendIntent.findUnique({
      where: { id: authorizedSpendIntent.id },
    })
    expect(updatedSpendIntent?.status).toBe('OUTSTANDING')

    // Second issuance attempt - should fail because status is no longer AUTHORIZED
    const request2 = new NextRequest('http://localhost:3000/api/spend-intents/test/issue-cheque', {
      method: 'POST',
      body: JSON.stringify({
        chequeNumber: 'CHQ-006',
        signer1Name: 'Charlie Brown',
        signer2Name: 'David White',
      }),
    })

    const params2 = Promise.resolve({ spendIntentId: authorizedSpendIntent.id })
    const response2 = await issueCheque(request2, { params: params2 })

    // Should fail with 400 because status is OUTSTANDING, not AUTHORIZED
    expect(response2.status).toBe(400)
    const data2 = await response2.json()
    expect(data2.error).toContain('must be AUTHORIZED')
    expect(data2.currentStatus).toBe('OUTSTANDING')
  })

  it('should require image when amount exceeds threshold', async () => {
    // Create high-value spend intent
    const highValueSpendIntent = await prisma.spendIntent.create({
      data: {
        teamId: testTeam.id,
        createdByUserId: treasurerUser.id,
        amountCents: 75000, // $750 - above $500 threshold
        currency: 'CAD',
        vendorId: testVendor.id,
        paymentMethod: 'CHEQUE',
        authorizationType: 'STANDING_BUDGET_AUTHORIZATION',
        requiresManualApproval: false,
        status: 'AUTHORIZED',
        authorizedAt: new Date(),
      },
    })

    vi.mocked(auth).mockResolvedValue({ userId: 'treasurer_cheque_test' } as any)

    const request = new NextRequest('http://localhost:3000/api/spend-intents/test/issue-cheque', {
      method: 'POST',
      body: JSON.stringify({
        chequeNumber: 'CHQ-007',
        signer1Name: 'Alice Johnson',
        signer2Name: 'Bob Smith',
        // Missing chequeImageFileId
      }),
    })

    const params = Promise.resolve({ spendIntentId: highValueSpendIntent.id })
    const response = await issueCheque(request, { params })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Cheque image is required')
    expect(data.reason).toContain('exceeds threshold')
  })

  it('should require image when requiresManualApproval is true', async () => {
    // Create spend intent that requires manual approval
    const manualApprovalSpendIntent = await prisma.spendIntent.create({
      data: {
        teamId: testTeam.id,
        createdByUserId: treasurerUser.id,
        amountCents: 30000, // $300 - below threshold
        currency: 'CAD',
        vendorId: testVendor.id,
        paymentMethod: 'CHEQUE',
        authorizationType: 'MANUAL_SIGNER_APPROVAL',
        requiresManualApproval: true,
        status: 'AUTHORIZED',
        authorizedAt: new Date(),
      },
    })

    vi.mocked(auth).mockResolvedValue({ userId: 'treasurer_cheque_test' } as any)

    const request = new NextRequest('http://localhost:3000/api/spend-intents/test/issue-cheque', {
      method: 'POST',
      body: JSON.stringify({
        chequeNumber: 'CHQ-008',
        signer1Name: 'Alice Johnson',
        signer2Name: 'Bob Smith',
        // Missing chequeImageFileId
      }),
    })

    const params = Promise.resolve({ spendIntentId: manualApprovalSpendIntent.id })
    const response = await issueCheque(request, { params })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Cheque image is required')
    expect(data.reason).toContain('requires manual approval')
  })

  it('should accept issuance without image when not required', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'treasurer_cheque_test' } as any)

    const request = new NextRequest('http://localhost:3000/api/spend-intents/test/issue-cheque', {
      method: 'POST',
      body: JSON.stringify({
        chequeNumber: 'CHQ-009',
        signer1Name: 'Alice Johnson',
        signer2Name: 'Bob Smith',
        // No chequeImageFileId, but amount is low and no manual approval required
      }),
    })

    const params = Promise.resolve({ spendIntentId: authorizedSpendIntent.id })
    const response = await issueCheque(request, { params })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.spendIntent.status).toBe('OUTSTANDING')
    expect(data.chequeMetadata.chequeImageFileId).toBeNull()
  })
})
