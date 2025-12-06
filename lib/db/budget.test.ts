import { describe, it, expect } from 'vitest'
import { calculateBudgetHealth } from './budget'

describe('Budget Calculations', () => {
  describe('calculateBudgetHealth', () => {
    it('should return "healthy" for percentages below 70%', () => {
      expect(calculateBudgetHealth(0)).toBe('healthy')
      expect(calculateBudgetHealth(30)).toBe('healthy')
      expect(calculateBudgetHealth(69.99)).toBe('healthy')
    })

    it('should return "warning" for percentages between 70% and 89.99%', () => {
      expect(calculateBudgetHealth(70)).toBe('warning')
      expect(calculateBudgetHealth(80)).toBe('warning')
      expect(calculateBudgetHealth(89.99)).toBe('warning')
    })

    it('should return "critical" for percentages 90% and above', () => {
      expect(calculateBudgetHealth(90)).toBe('critical')
      expect(calculateBudgetHealth(95)).toBe('critical')
      expect(calculateBudgetHealth(100)).toBe('critical')
      expect(calculateBudgetHealth(150)).toBe('critical')
    })

    it('should handle negative percentages', () => {
      // This might happen if there are refunds/credits
      expect(calculateBudgetHealth(-10)).toBe('healthy')
    })

    it('should handle decimal values correctly', () => {
      expect(calculateBudgetHealth(69.5)).toBe('healthy')
      expect(calculateBudgetHealth(70.0)).toBe('warning')
      expect(calculateBudgetHealth(89.9)).toBe('warning')
      expect(calculateBudgetHealth(90.0)).toBe('critical')
    })
  })
})
