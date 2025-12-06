import { describe, it, expect } from 'vitest'
import { cn, formatCurrency } from './utils'

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names', () => {
      expect(cn('px-2 py-1', 'bg-blue-500')).toBe('px-2 py-1 bg-blue-500')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      expect(cn('base-class', isActive && 'active-class')).toBe('base-class active-class')
    })

    it('should handle Tailwind merge conflicts', () => {
      // twMerge should prioritize the last class
      expect(cn('px-2', 'px-4')).toBe('px-4')
    })

    it('should handle arrays of classes', () => {
      expect(cn(['px-2', 'py-1'], 'bg-blue-500')).toBe('px-2 py-1 bg-blue-500')
    })

    it('should handle undefined and null values', () => {
      expect(cn('px-2', undefined, 'py-1', null)).toBe('px-2 py-1')
    })

    it('should handle object notation', () => {
      expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500')
    })
  })

  describe('formatCurrency', () => {
    it('should format whole numbers without decimals', () => {
      expect(formatCurrency(1000)).toBe('$1,000')
    })

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0')
    })

    it('should handle large numbers with thousands separators', () => {
      expect(formatCurrency(1234567)).toBe('$1,234,567')
    })

    it('should round decimals to whole numbers', () => {
      expect(formatCurrency(1000.99)).toBe('$1,001')
    })

    it('should handle negative amounts', () => {
      expect(formatCurrency(-500)).toBe('-$500')
    })

    it('should format small amounts', () => {
      expect(formatCurrency(1)).toBe('$1')
    })
  })
})
