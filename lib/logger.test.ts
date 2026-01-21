import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger } from './logger'

describe('Logger', () => {
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    vi.restoreAllMocks()
  })

  describe('logging methods', () => {
    it('should log debug messages with console.log', () => {
      logger.debug('Test debug message', { key: 'value' })
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] Test debug message'),
        { key: 'value' }
      )
    })

    it('should log info messages with console.log', () => {
      logger.info('Test info message')
      expect(console.log).toHaveBeenCalledWith('[INFO] Test info message', '')
    })

    it('should log warning messages with console.warn', () => {
      logger.warn('Test warning message')
      expect(console.warn).toHaveBeenCalledWith('[WARN] Test warning message', '')
    })

    it('should log error messages with console.error', () => {
      const error = new Error('Test error')
      logger.error('Test error message', error)
      expect(console.error).toHaveBeenCalledWith(
        '[ERROR] Test error message',
        error,
        ''
      )
    })

    it('should log API requests with console.log', () => {
      logger.api('GET', '/api/test', 200, 150)
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/test - 200 (150ms)'),
        ''
      )
    })

    it('should log database queries with console.log', () => {
      logger.query('findMany', 'User', 50)
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('DB: findMany User (50ms)'),
        ''
      )
    })

    it('should log auth events with console.log', () => {
      logger.auth('login', 'user123')
      expect(console.log).toHaveBeenCalledWith('[AUTH] login', { userId: 'user123' })
    })

    it('should log business events with console.log', () => {
      logger.business('transaction_created', { amount: 100 })
      expect(console.log).toHaveBeenCalledWith(
        '[BUSINESS] transaction_created',
        { amount: 100 }
      )
    })

    it('should handle API requests with error status codes', () => {
      logger.api('POST', '/api/error', 500, 100)
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('POST /api/error - 500 (100ms)'),
        ''
      )
    })

    it('should handle slow database queries', () => {
      logger.query('findMany', 'Transaction', 1500)
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('DB: findMany Transaction (1500ms)'),
        ''
      )
    })
  })
})
