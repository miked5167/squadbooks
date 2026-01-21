/**
 * Unit Tests for Plaid Transaction Reconciliation
 *
 * Tests cover:
 * - ingestPlaidTransactions
 * - matchPlaidBankTxToSpendIntent
 * - reconcilePlaidBankTransaction
 * - Policy exception detection
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { ingestPlaidTransactions } from '../ingest'
import { matchPlaidBankTxToSpendIntent } from '../matcher'
import { reconcilePlaidBankTransaction } from '../reconcile'
import { detectETransferPaidWithoutApproval, detectChequeMissingEvidence } from '../exceptions'

describe('Plaid Transaction Reconciliation', () => {
  let testTeamId: string
  let testUserId: string
  let testVendorId: string

  beforeAll(async () => {
    // Create test team
    const team = await prisma.team.create({
      data: {
        name: 'Test Team - Plaid Reconciliation',
        season: '2025-26',
        budgetTotal: 10000,
      },
    })
    testTeamId = team.id

    // Create test user
    const user = await prisma.user.create({
      data: {
        clerkId: 'test-clerk-id-plaid',
        email: 'plaid-test@example.com',
        name: 'Plaid Test User',
        teamId: testTeamId,
      },
    })
    testUserId = user.id

    // Create test vendor
    const vendor = await prisma.vendor.create({
      data: {
        teamId: testTeamId,
        name: 'Test Vendor',
      },
    })
    testVendorId = vendor.id

    // Create team settings
    await prisma.teamSettings.create({
      data: {
        teamId: testTeamId,
        dualApprovalEnabled: true,
        dualApprovalThreshold: 200,
        requireChequeImageThresholdCents: 50000, // $500
      },
    })
  })

  afterAll(async () => {
    // Cleanup
    await prisma.policyException.deleteMany({ where: { transaction: { teamId: testTeamId } } })
    await prisma.transaction.deleteMany({ where: { teamId: testTeamId } })
    await prisma.plaidBankTransaction.deleteMany({ where: { teamId: testTeamId } })
    await prisma.spendIntentApproval.deleteMany({ where: { spendIntent: { teamId: testTeamId } } })
    await prisma.chequeMetadata.deleteMany({ where: { spendIntent: { teamId: testTeamId } } })
    await prisma.spendIntent.deleteMany({ where: { teamId: testTeamId } })
    await prisma.teamSettings.delete({ where: { teamId: testTeamId } })
    await prisma.vendor.deleteMany({ where: { teamId: testTeamId } })
    await prisma.user.delete({ where: { id: testUserId } })
    await prisma.team.delete({ where: { id: testTeamId } })
  })

  beforeEach(async () => {
    // Clean up between tests
    await prisma.policyException.deleteMany({ where: { transaction: { teamId: testTeamId } } })
    await prisma.transaction.deleteMany({ where: { teamId: testTeamId } })
    await prisma.plaidBankTransaction.deleteMany({ where: { teamId: testTeamId } })
    await prisma.spendIntentApproval.deleteMany({ where: { spendIntent: { teamId: testTeamId } } })
    await prisma.chequeMetadata.deleteMany({ where: { spendIntent: { teamId: testTeamId } } })
    await prisma.spendIntent.deleteMany({ where: { teamId: testTeamId } })
  })

  describe('ingestPlaidTransactions', () => {
    it('should upsert Plaid transactions correctly', async () => {
      const transactions = [
        {
          transaction_id: 'plaid-tx-001',
          amount: 100.5,
          iso_currency_code: 'CAD',
          date: '2025-01-01',
          authorized_date: '2024-12-31',
          name: 'Test Merchant',
          merchant_name: 'Test Merchant Inc',
          payment_channel: 'online',
          pending: false,
        },
        {
          transaction_id: 'plaid-tx-002',
          amount: 50.0,
          iso_currency_code: 'CAD',
          date: '2025-01-02',
          name: 'Another Merchant',
          pending: false,
        },
      ]

      const result = await ingestPlaidTransactions(testTeamId, transactions)

      expect(result.inserted).toBe(2)
      expect(result.updated).toBe(0)
      expect(result.errors).toHaveLength(0)

      // Verify records were created
      const plaidTx1 = await prisma.plaidBankTransaction.findUnique({
        where: { plaidTransactionId: 'plaid-tx-001' },
      })

      expect(plaidTx1).toBeTruthy()
      expect(plaidTx1?.amountCents).toBe(10050) // $100.50 in cents
      expect(plaidTx1?.merchantName).toBe('Test Merchant Inc')

      // Test upsert (update existing)
      transactions[0].amount = 105.0 // Changed amount
      const result2 = await ingestPlaidTransactions(testTeamId, transactions)

      expect(result2.inserted).toBe(0)
      expect(result2.updated).toBe(2)

      const plaidTx1Updated = await prisma.plaidBankTransaction.findUnique({
        where: { plaidTransactionId: 'plaid-tx-001' },
      })
      expect(plaidTx1Updated?.amountCents).toBe(10500) // Updated to $105.00
    })
  })

  describe('matchPlaidBankTxToSpendIntent', () => {
    it('should match bank transaction to spend intent (simple case)', async () => {
      // Create a SpendIntent
      const spendIntent = await prisma.spendIntent.create({
        data: {
          teamId: testTeamId,
          createdByUserId: testUserId,
          amountCents: 10000, // $100.00
          vendorId: testVendorId,
          paymentMethod: 'E_TRANSFER',
          authorizationType: 'MANUAL_SIGNER_APPROVAL',
          status: 'AUTHORIZED',
          authorizedAt: new Date('2025-01-01T10:00:00Z'),
          createdAt: new Date('2025-01-02T00:00:00Z'), // Within ±14 days of postedAt
        },
      })

      // Create a PlaidBankTransaction
      const bankTx = await prisma.plaidBankTransaction.create({
        data: {
          teamId: testTeamId,
          plaidTransactionId: 'plaid-match-001',
          amountCents: 10000,
          postedAt: new Date('2025-01-05T00:00:00Z'),
          pending: false,
          raw: {},
        },
      })

      // Match
      const matchResult = await matchPlaidBankTxToSpendIntent(testTeamId, bankTx)

      expect(matchResult.matched).toBe(true)
      expect(matchResult.spendIntentId).toBe(spendIntent.id)
      expect(matchResult.reason).toContain('Matched to SpendIntent')
    })

    it('should not match if amount is different', async () => {
      await prisma.spendIntent.create({
        data: {
          teamId: testTeamId,
          createdByUserId: testUserId,
          amountCents: 10000,
          vendorId: testVendorId,
          paymentMethod: 'E_TRANSFER',
          authorizationType: 'MANUAL_SIGNER_APPROVAL',
          status: 'AUTHORIZED',
        },
      })

      const bankTx = await prisma.plaidBankTransaction.create({
        data: {
          teamId: testTeamId,
          plaidTransactionId: 'plaid-no-match-001',
          amountCents: 15000, // Different amount
          postedAt: new Date('2025-01-05T00:00:00Z'),
          pending: false,
          raw: {},
        },
      })

      const matchResult = await matchPlaidBankTxToSpendIntent(testTeamId, bankTx)

      expect(matchResult.matched).toBe(false)
      expect(matchResult.reason).toContain('No matching SpendIntent found')
    })

    it('should prefer spend intent created BEFORE bank transaction', async () => {
      const postedAt = new Date('2025-01-10T00:00:00Z')

      // Create two SpendIntents with same amount
      const spendIntent1 = await prisma.spendIntent.create({
        data: {
          teamId: testTeamId,
          createdByUserId: testUserId,
          amountCents: 10000,
          vendorId: testVendorId,
          paymentMethod: 'E_TRANSFER',
          authorizationType: 'MANUAL_SIGNER_APPROVAL',
          status: 'AUTHORIZED',
          createdAt: new Date('2025-01-05T00:00:00Z'), // 5 days before
        },
      })

      await prisma.spendIntent.create({
        data: {
          teamId: testTeamId,
          createdByUserId: testUserId,
          amountCents: 10000,
          vendorId: testVendorId,
          paymentMethod: 'E_TRANSFER',
          authorizationType: 'MANUAL_SIGNER_APPROVAL',
          status: 'AUTHORIZED',
          createdAt: new Date('2025-01-15T00:00:00Z'), // 5 days after
        },
      })

      const bankTx = await prisma.plaidBankTransaction.create({
        data: {
          teamId: testTeamId,
          plaidTransactionId: 'plaid-prefer-001',
          amountCents: 10000,
          postedAt,
          pending: false,
          raw: {},
        },
      })

      const matchResult = await matchPlaidBankTxToSpendIntent(testTeamId, bankTx)

      expect(matchResult.matched).toBe(true)
      expect(matchResult.spendIntentId).toBe(spendIntent1.id) // Should prefer the earlier one
    })
  })

  describe('Policy Exceptions - E-Transfer Paid Without Approval', () => {
    it('should create CRITICAL exception when e-transfer paid before authorization', async () => {
      const bankTxTime = new Date('2025-01-01T10:00:00Z')
      const authorizedTime = new Date('2025-01-02T10:00:00Z') // Authorized AFTER payment

      const spendIntent = await prisma.spendIntent.create({
        data: {
          teamId: testTeamId,
          createdByUserId: testUserId,
          amountCents: 10000,
          vendorId: testVendorId,
          paymentMethod: 'E_TRANSFER',
          authorizationType: 'MANUAL_SIGNER_APPROVAL',
          requiresManualApproval: true,
          status: 'AUTHORIZATION_PENDING',
          authorizedAt: authorizedTime,
          createdAt: new Date('2024-12-28T00:00:00Z'), // Within ±14 days of bankTxTime
        },
      })

      const bankTx = await prisma.plaidBankTransaction.create({
        data: {
          teamId: testTeamId,
          plaidTransactionId: 'plaid-etransfer-001',
          amountCents: 10000,
          postedAt: bankTxTime,
          pending: false,
          raw: {},
        },
      })

      // Reconcile
      const result = await reconcilePlaidBankTransaction(testTeamId, bankTx.plaidTransactionId)

      expect(result.success).toBe(true)
      expect(result.matched).toBe(true)
      expect(result.exceptions).toHaveLength(1)
      expect(result.exceptions[0].type).toBe('ETRANSFER_PAID_WITHOUT_REQUIRED_APPROVAL')
      expect(result.exceptions[0].severity).toBe('CRITICAL')
    })

    it('should NOT create exception when e-transfer paid AFTER authorization', async () => {
      const authorizedTime = new Date('2025-01-01T10:00:00Z')
      const bankTxTime = new Date('2025-01-02T10:00:00Z') // Paid AFTER authorization

      const spendIntent = await prisma.spendIntent.create({
        data: {
          teamId: testTeamId,
          createdByUserId: testUserId,
          amountCents: 10000,
          vendorId: testVendorId,
          paymentMethod: 'E_TRANSFER',
          authorizationType: 'MANUAL_SIGNER_APPROVAL',
          requiresManualApproval: true,
          status: 'AUTHORIZED',
          authorizedAt: authorizedTime,
          createdAt: new Date('2024-12-28T00:00:00Z'), // Within ±14 days of bankTxTime
        },
      })

      const bankTx = await prisma.plaidBankTransaction.create({
        data: {
          teamId: testTeamId,
          plaidTransactionId: 'plaid-etransfer-002',
          amountCents: 10000,
          postedAt: bankTxTime,
          pending: false,
          raw: {},
        },
      })

      const result = await reconcilePlaidBankTransaction(testTeamId, bankTx.plaidTransactionId)

      expect(result.success).toBe(true)
      expect(result.matched).toBe(true)
      expect(result.exceptions).toHaveLength(0) // No exceptions
    })
  })

  describe('Policy Exceptions - Cheque Missing Evidence', () => {
    it('should create CHEQUE_MISSING_EVIDENCE exception when metadata is missing', async () => {
      const spendIntent = await prisma.spendIntent.create({
        data: {
          teamId: testTeamId,
          createdByUserId: testUserId,
          amountCents: 30000, // $300
          vendorId: testVendorId,
          paymentMethod: 'CHEQUE',
          authorizationType: 'MANUAL_SIGNER_APPROVAL',
          status: 'OUTSTANDING',
          createdAt: new Date('2025-01-02T00:00:00Z'), // Within ±14 days of postedAt
        },
      })

      const bankTx = await prisma.plaidBankTransaction.create({
        data: {
          teamId: testTeamId,
          plaidTransactionId: 'plaid-cheque-001',
          amountCents: 30000,
          postedAt: new Date('2025-01-05T00:00:00Z'),
          pending: false,
          raw: {},
        },
      })

      const result = await reconcilePlaidBankTransaction(testTeamId, bankTx.plaidTransactionId)

      expect(result.success).toBe(true)
      expect(result.matched).toBe(true)
      expect(result.exceptions).toHaveLength(1)
      expect(result.exceptions[0].type).toBe('CHEQUE_MISSING_EVIDENCE')
      expect(result.exceptions[0].severity).toBe('WARNING') // Below $500 threshold
    })

    it('should create CRITICAL exception when cheque > threshold missing image', async () => {
      const spendIntent = await prisma.spendIntent.create({
        data: {
          teamId: testTeamId,
          createdByUserId: testUserId,
          amountCents: 60000, // $600 - above $500 threshold
          vendorId: testVendorId,
          paymentMethod: 'CHEQUE',
          authorizationType: 'MANUAL_SIGNER_APPROVAL',
          status: 'OUTSTANDING',
          createdAt: new Date('2025-01-02T00:00:00Z'), // Within ±14 days of postedAt
        },
      })

      // Create cheque metadata but missing image
      await prisma.chequeMetadata.create({
        data: {
          spendIntentId: spendIntent.id,
          chequeNumber: '12345',
          signer1UserId: testUserId,
          signer2UserId: testUserId, // Has signer2
          issuedAt: new Date('2025-01-01T00:00:00Z'),
          // chequeImageFileId is missing
        },
      })

      const bankTx = await prisma.plaidBankTransaction.create({
        data: {
          teamId: testTeamId,
          plaidTransactionId: 'plaid-cheque-002',
          amountCents: 60000,
          postedAt: new Date('2025-01-05T00:00:00Z'),
          pending: false,
          raw: {},
        },
      })

      const result = await reconcilePlaidBankTransaction(testTeamId, bankTx.plaidTransactionId)

      expect(result.success).toBe(true)
      expect(result.matched).toBe(true)
      expect(result.exceptions).toHaveLength(1)
      expect(result.exceptions[0].type).toBe('CHEQUE_MISSING_EVIDENCE')
      expect(result.exceptions[0].severity).toBe('CRITICAL') // Above threshold
    })

    it('should NOT create exception when cheque has all required evidence', async () => {
      const spendIntent = await prisma.spendIntent.create({
        data: {
          teamId: testTeamId,
          createdByUserId: testUserId,
          amountCents: 60000,
          vendorId: testVendorId,
          paymentMethod: 'CHEQUE',
          authorizationType: 'MANUAL_SIGNER_APPROVAL',
          status: 'OUTSTANDING',
          createdAt: new Date('2025-01-02T00:00:00Z'), // Within ±14 days of postedAt
        },
      })

      // Create complete cheque metadata
      await prisma.chequeMetadata.create({
        data: {
          spendIntentId: spendIntent.id,
          chequeNumber: '12345',
          signer1UserId: testUserId,
          signer2UserId: testUserId,
          issuedAt: new Date('2025-01-01T00:00:00Z'),
          chequeImageFileId: 'file-123', // Has image
        },
      })

      const bankTx = await prisma.plaidBankTransaction.create({
        data: {
          teamId: testTeamId,
          plaidTransactionId: 'plaid-cheque-003',
          amountCents: 60000,
          postedAt: new Date('2025-01-05T00:00:00Z'),
          pending: false,
          raw: {},
        },
      })

      const result = await reconcilePlaidBankTransaction(testTeamId, bankTx.plaidTransactionId)

      expect(result.success).toBe(true)
      expect(result.matched).toBe(true)
      expect(result.exceptions).toHaveLength(0) // No exceptions
    })
  })

  describe('Unmatched Bank Transactions', () => {
    it('should create UNMATCHED_BANK_TRANSACTION exception when no match found', async () => {
      const bankTx = await prisma.plaidBankTransaction.create({
        data: {
          teamId: testTeamId,
          plaidTransactionId: 'plaid-unmatched-001',
          amountCents: 99999, // No matching spend intent
          postedAt: new Date('2025-01-05T00:00:00Z'),
          merchantName: 'Unknown Merchant',
          pending: false,
          raw: {},
        },
      })

      const result = await reconcilePlaidBankTransaction(testTeamId, bankTx.plaidTransactionId)

      expect(result.success).toBe(true)
      expect(result.matched).toBe(false)
      expect(result.exceptions).toHaveLength(1)
      expect(result.exceptions[0].type).toBe('UNMATCHED_BANK_TRANSACTION')
      expect(result.exceptions[0].severity).toBe('WARNING')
    })
  })

  describe('Exception Persistence', () => {
    it('should persist exceptions even if SpendIntent later becomes authorized', async () => {
      // Create spend intent that will be paid before authorization
      const spendIntent = await prisma.spendIntent.create({
        data: {
          teamId: testTeamId,
          createdByUserId: testUserId,
          amountCents: 10000,
          vendorId: testVendorId,
          paymentMethod: 'E_TRANSFER',
          authorizationType: 'MANUAL_SIGNER_APPROVAL',
          requiresManualApproval: true,
          status: 'AUTHORIZATION_PENDING',
          createdAt: new Date('2024-12-28T00:00:00Z'), // Within ±14 days of postedAt
          // No authorizedAt yet
        },
      })

      const bankTx = await prisma.plaidBankTransaction.create({
        data: {
          teamId: testTeamId,
          plaidTransactionId: 'plaid-persist-001',
          amountCents: 10000,
          postedAt: new Date('2025-01-01T10:00:00Z'),
          pending: false,
          raw: {},
        },
      })

      // Reconcile - should create exception
      const result = await reconcilePlaidBankTransaction(testTeamId, bankTx.plaidTransactionId)

      expect(result.exceptions).toHaveLength(1)
      const exceptionId = result.exceptions[0].id

      // Later authorize the SpendIntent
      await prisma.spendIntent.update({
        where: { id: spendIntent.id },
        data: {
          authorizedAt: new Date('2025-01-02T10:00:00Z'),
          status: 'AUTHORIZED',
        },
      })

      // Exception should still exist
      const exception = await prisma.policyException.findUnique({
        where: { id: exceptionId },
      })

      expect(exception).toBeTruthy()
      expect(exception?.type).toBe('ETRANSFER_PAID_WITHOUT_REQUIRED_APPROVAL')
    })
  })
})
