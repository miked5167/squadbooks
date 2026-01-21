import { describe, it, expect } from 'vitest'
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  TransactionFilterSchema,
  TransactionTypeEnum,
  TransactionStatusEnum,
} from './transaction'

describe('Transaction Validations', () => {
  describe('TransactionTypeEnum', () => {
    it('should accept valid transaction types', () => {
      expect(TransactionTypeEnum.parse('INCOME')).toBe('INCOME')
      expect(TransactionTypeEnum.parse('EXPENSE')).toBe('EXPENSE')
    })

    it('should reject invalid transaction types', () => {
      expect(() => TransactionTypeEnum.parse('INVALID')).toThrow()
      expect(() => TransactionTypeEnum.parse('income')).toThrow()
    })
  })

  describe('TransactionStatusEnum', () => {
    it('should accept valid status values', () => {
      expect(TransactionStatusEnum.parse('DRAFT')).toBe('DRAFT')
      expect(TransactionStatusEnum.parse('PENDING')).toBe('PENDING')
      expect(TransactionStatusEnum.parse('APPROVED')).toBe('APPROVED')
      expect(TransactionStatusEnum.parse('REJECTED')).toBe('REJECTED')
    })

    it('should reject invalid status values', () => {
      expect(() => TransactionStatusEnum.parse('INVALID')).toThrow()
      expect(() => TransactionStatusEnum.parse('pending')).toThrow()
    })
  })

  describe('CreateTransactionSchema', () => {
    const validTransaction = {
      type: 'EXPENSE' as const,
      amount: 100.50,
      categoryId: 'cat_123',
      vendor: 'Test Vendor',
      description: 'Test description',
      transactionDate: new Date().toISOString(),
      receiptUrl: 'https://example.com/receipt.pdf',
    }

    it('should accept a valid transaction', () => {
      const result = CreateTransactionSchema.parse(validTransaction)
      expect(result).toEqual(validTransaction)
    })

    it('should accept transaction without optional fields', () => {
      const minimal = {
        type: 'INCOME' as const,
        amount: 50.00,
        categoryId: 'cat_456',
        vendor: 'Vendor Name',
        transactionDate: new Date().toISOString(),
      }
      const result = CreateTransactionSchema.parse(minimal)
      expect(result.description).toBeUndefined()
      expect(result.receiptUrl).toBeUndefined()
    })

    describe('amount validation', () => {
      it('should reject negative amounts', () => {
        const invalid = { ...validTransaction, amount: -10 }
        expect(() => CreateTransactionSchema.parse(invalid)).toThrow('Amount must be positive')
      })

      it('should reject zero amount', () => {
        const invalid = { ...validTransaction, amount: 0 }
        expect(() => CreateTransactionSchema.parse(invalid)).toThrow('Amount must be positive')
      })

      it('should reject amounts over $100,000', () => {
        const invalid = { ...validTransaction, amount: 100001 }
        expect(() => CreateTransactionSchema.parse(invalid)).toThrow('Amount cannot exceed $100,000')
      })

      it('should reject amounts with more than 2 decimal places', () => {
        const invalid = { ...validTransaction, amount: 100.123 }
        expect(() => CreateTransactionSchema.parse(invalid)).toThrow('Amount must have at most 2 decimal places')
      })

      it('should accept amounts with exactly 2 decimal places', () => {
        const valid = { ...validTransaction, amount: 99.99 }
        expect(CreateTransactionSchema.parse(valid).amount).toBe(99.99)
      })
    })

    describe('vendor validation', () => {
      it('should reject empty vendor', () => {
        const invalid = { ...validTransaction, vendor: '' }
        expect(() => CreateTransactionSchema.parse(invalid)).toThrow('Vendor/Payee is required')
      })

      it('should reject vendor name longer than 255 characters', () => {
        const invalid = { ...validTransaction, vendor: 'a'.repeat(256) }
        expect(() => CreateTransactionSchema.parse(invalid)).toThrow('Vendor name too long')
      })
    })

    describe('description validation', () => {
      it('should reject description longer than 500 characters', () => {
        const invalid = { ...validTransaction, description: 'a'.repeat(501) }
        expect(() => CreateTransactionSchema.parse(invalid)).toThrow('Description too long')
      })

      it('should accept description up to 500 characters', () => {
        const valid = { ...validTransaction, description: 'a'.repeat(500) }
        expect(CreateTransactionSchema.parse(valid).description).toHaveLength(500)
      })
    })

    describe('transactionDate validation', () => {
      it('should reject future dates', () => {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 1)
        const invalid = { ...validTransaction, transactionDate: futureDate.toISOString() }
        expect(() => CreateTransactionSchema.parse(invalid)).toThrow('Transaction date cannot be in the future')
      })

      it('should accept past dates', () => {
        const pastDate = new Date()
        pastDate.setDate(pastDate.getDate() - 1)
        const valid = { ...validTransaction, transactionDate: pastDate.toISOString() }
        expect(CreateTransactionSchema.parse(valid)).toBeDefined()
      })

      it('should accept today\'s date', () => {
        const today = new Date().toISOString()
        const valid = { ...validTransaction, transactionDate: today }
        expect(CreateTransactionSchema.parse(valid)).toBeDefined()
      })
    })

    describe('receiptUrl validation', () => {
      it('should reject invalid URLs', () => {
        const invalid = { ...validTransaction, receiptUrl: 'not-a-url' }
        expect(() => CreateTransactionSchema.parse(invalid)).toThrow()
      })

      it('should accept valid URLs', () => {
        const valid = { ...validTransaction, receiptUrl: 'https://example.com/receipt.pdf' }
        expect(CreateTransactionSchema.parse(valid).receiptUrl).toBe('https://example.com/receipt.pdf')
      })
    })
  })

  describe('UpdateTransactionSchema', () => {
    it('should accept partial updates', () => {
      const partial = { amount: 50.00 }
      const result = UpdateTransactionSchema.parse(partial)
      expect(result.amount).toBe(50.00)
    })

    it('should accept empty update object', () => {
      const result = UpdateTransactionSchema.parse({})
      expect(result).toEqual({})
    })

    it('should validate amount when provided', () => {
      const invalid = { amount: -10 }
      expect(() => UpdateTransactionSchema.parse(invalid)).toThrow('Amount must be positive')
    })
  })

  describe('TransactionFilterSchema', () => {
    it('should apply default values', () => {
      const result = TransactionFilterSchema.parse({})
      expect(result.page).toBe(1)
      expect(result.perPage).toBe(50)
      expect(result.sortBy).toBe('date')
      expect(result.sortOrder).toBe('desc')
    })

    it('should accept custom values', () => {
      const custom = {
        type: 'EXPENSE' as const,
        status: 'APPROVED' as const,
        categoryId: 'cat_123',
        page: 2,
        perPage: 25,
        sortBy: 'amount' as const,
        sortOrder: 'asc' as const,
      }
      const result = TransactionFilterSchema.parse(custom)
      expect(result).toEqual(custom)
    })

    it('should reject perPage over 100', () => {
      const invalid = { perPage: 101 }
      expect(() => TransactionFilterSchema.parse(invalid)).toThrow()
    })

    it('should reject negative page numbers', () => {
      const invalid = { page: -1 }
      expect(() => TransactionFilterSchema.parse(invalid)).toThrow()
    })
  })
})
