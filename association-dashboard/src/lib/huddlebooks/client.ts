/**
 * HuddleBooks API Client
 *
 * Connects to the HuddleBooks API to fetch team financial data for daily snapshots.
 * Includes retry logic, timeout handling, and error management.
 */

import {
  TeamSummary,
  TeamBudget,
  TransactionsResponse,
  TransactionFilter,
  HuddleBooksApiError,
  HuddleBooksApiResponse,
} from '@/types/huddlebooks'

// ============================================
// CONFIGURATION
// ============================================

const DEFAULT_TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 3
const INITIAL_BACKOFF = 1000 // 1 second

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(retryCount: number): number {
  return INITIAL_BACKOFF * Math.pow(2, retryCount)
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new HuddleBooksApiError('Request timeout', 408, 'TIMEOUT')
    }
    throw error
  }
}

/**
 * Retry a function with exponential backoff
 */
async function retry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error

  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Don't retry on 4xx errors (client errors)
      if (error instanceof HuddleBooksApiError && error.statusCode >= 400 && error.statusCode < 500) {
        throw error
      }

      // If we have retries left, wait and try again
      if (i < retries - 1) {
        const delay = getBackoffDelay(i)
        console.warn(
          `Request failed (attempt ${i + 1}/${retries}), retrying in ${delay}ms...`,
          error instanceof Error ? error.message : 'Unknown error'
        )
        await sleep(delay)
      }
    }
  }

  throw lastError!
}

// ============================================
// HUDDLEBOOKS API CLIENT
// ============================================

export class HuddleBooksClient {
  private baseUrl: string
  private accessToken: string

  constructor(accessToken: string, baseUrl?: string) {
    this.accessToken = accessToken
    this.baseUrl = baseUrl || process.env.HUDDLEBOOKS_API_BASE_URL || 'https://api.huddlebooks.app/api/v1'
  }

  /**
   * Make an authenticated request to the HuddleBooks API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetchWithTimeout(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      let errorCode = `HTTP_${response.status}`

      try {
        const errorBody = await response.json()
        if (errorBody.error) {
          errorMessage = errorBody.error
        }
        if (errorBody.code) {
          errorCode = errorBody.code
        }
      } catch {
        // If we can't parse the error body, use the default message
      }

      throw new HuddleBooksApiError(errorMessage, response.status, errorCode)
    }

    // Parse and return the response
    try {
      const data = await response.json()
      return data as T
    } catch (error) {
      throw new HuddleBooksApiError(
        'Failed to parse response JSON',
        500,
        'PARSE_ERROR'
      )
    }
  }

  /**
   * Get team summary with financial snapshot
   *
   * Returns overall team information including budget, spending, pending approvals,
   * bank connection status, and operational metrics.
   */
  async getTeamSummary(teamId: string): Promise<TeamSummary> {
    return retry(async () => {
      try {
        // Fetch team data, budget overview, and operational metrics
        const [teamData, budgetData, metrics] = await Promise.all([
          this.request<any>(`/teams/${teamId}`),
          this.request<any>(`/teams/${teamId}/budget`),
          this.request<any>(`/teams/${teamId}/metrics`),
        ])

        // Transform the data into TeamSummary format
        const summary: TeamSummary = {
          teamId: teamData.id,
          teamName: teamData.name,
          division: teamData.division || null,
          season: teamData.season || new Date().getFullYear().toString(),

          // Financial snapshot
          budgetTotal: Number(budgetData.totalBudget || 0),
          budgetAllocated: Number(budgetData.totalAllocated || 0),
          spent: Number(budgetData.totalSpent || 0),
          pending: Number(budgetData.totalPending || 0),
          remaining: Number(budgetData.totalRemaining || 0),
          percentUsed: Number(budgetData.overallPercentage || 0),

          // Treasurer information
          treasurer: {
            name: teamData.treasurer?.name || 'Unknown',
            email: teamData.treasurer?.email || '',
            lastLogin: teamData.treasurer?.lastLogin
              ? new Date(teamData.treasurer.lastLogin)
              : null,
          },

          // Operational metrics
          pendingApprovals: metrics.pendingApprovals || 0,
          missingReceipts: metrics.missingReceipts || 0,
          totalTransactions: metrics.totalTransactions || 0,
          lastActivityAt: metrics.lastActivityAt
            ? new Date(metrics.lastActivityAt)
            : null,

          // Bank connection status
          bankConnected: teamData.bankConnected || false,
          bankReconciledThrough: teamData.bankReconciledThrough
            ? new Date(teamData.bankReconciledThrough)
            : null,

          // Timestamps
          snapshotAt: new Date(),
        }

        return summary
      } catch (error) {
        if (error instanceof HuddleBooksApiError) {
          throw error
        }
        throw new HuddleBooksApiError(
          `Failed to fetch team summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
          'TEAM_SUMMARY_ERROR'
        )
      }
    })
  }

  /**
   * Get team budget breakdown by category
   *
   * Returns detailed budget allocation and spending for each category.
   */
  async getTeamBudget(teamId: string): Promise<TeamBudget> {
    return retry(async () => {
      try {
        const budgetData = await this.request<TeamBudget>(`/teams/${teamId}/budget`)
        return budgetData
      } catch (error) {
        if (error instanceof HuddleBooksApiError) {
          throw error
        }
        throw new HuddleBooksApiError(
          `Failed to fetch team budget: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
          'TEAM_BUDGET_ERROR'
        )
      }
    })
  }

  /**
   * Get team transactions with pagination and filters
   *
   * Returns a paginated list of transactions with optional filtering.
   */
  async getTransactions(
    teamId: string,
    params: TransactionFilter = {}
  ): Promise<TransactionsResponse> {
    return retry(async () => {
      try {
        // Build query string
        const queryParams = new URLSearchParams()

        if (params.type) queryParams.append('type', params.type)
        if (params.status) queryParams.append('status', params.status)
        if (params.categoryId) queryParams.append('categoryId', params.categoryId)
        if (params.startDate) queryParams.append('startDate', params.startDate)
        if (params.endDate) queryParams.append('endDate', params.endDate)
        if (params.page) queryParams.append('page', params.page.toString())
        if (params.perPage) queryParams.append('perPage', params.perPage.toString())
        if (params.sortBy) queryParams.append('sortBy', params.sortBy)
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

        const queryString = queryParams.toString()
        const endpoint = `/teams/${teamId}/transactions${queryString ? `?${queryString}` : ''}`

        const response = await this.request<TransactionsResponse>(endpoint)
        return response
      } catch (error) {
        if (error instanceof HuddleBooksApiError) {
          throw error
        }
        throw new HuddleBooksApiError(
          `Failed to fetch transactions: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
          'TRANSACTIONS_ERROR'
        )
      }
    })
  }

  /**
   * Health check - verifies the access token is valid
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.request<any>('/health')
      return true
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }
}

// ============================================
// MOCK CLIENT FOR TESTING
// ============================================

/**
 * Mock HuddleBooks client for testing without live API
 */
export class MockHuddleBooksClient extends HuddleBooksClient {
  constructor() {
    super('mock-token', 'mock://api')
  }

  async getTeamSummary(teamId: string): Promise<TeamSummary> {
    await sleep(100) // Simulate network delay

    return {
      teamId,
      teamName: `Mock Team ${teamId}`,
      division: 'Bantam AA',
      season: '2025-2026',
      budgetTotal: 25000,
      budgetAllocated: 24000,
      spent: 18750,
      pending: 1500,
      remaining: 3750,
      percentUsed: 78.13,
      treasurer: {
        name: 'John Doe',
        email: 'john@example.com',
        lastLogin: new Date(),
      },
      pendingApprovals: 3,
      missingReceipts: 2,
      totalTransactions: 45,
      lastActivityAt: new Date(),
      bankConnected: true,
      bankReconciledThrough: new Date(),
      snapshotAt: new Date(),
    }
  }

  async getTeamBudget(teamId: string): Promise<TeamBudget> {
    await sleep(100)

    return {
      season: '2025-2026',
      totalBudget: 25000,
      totalAllocated: 24000,
      totalSpent: 18750,
      totalPending: 1500,
      totalRemaining: 3750,
      overallPercentage: 78.13,
      projectedPercentage: 84.38,
      overallHealth: 'warning',
      projectedHealth: 'warning',
      categories: [
        {
          categoryId: '1',
          categoryName: 'Ice Time',
          categoryHeading: 'Operations',
          categoryColor: '#3b82f6',
          allocated: 13750,
          spent: 12450,
          pending: 500,
          remaining: 800,
          percentage: 90.55,
          projectedPercentage: 94.18,
          health: 'critical',
          projectedHealth: 'critical',
        },
        {
          categoryId: '2',
          categoryName: 'Equipment',
          categoryHeading: 'Operations',
          categoryColor: '#10b981',
          allocated: 5000,
          spent: 4200,
          pending: 300,
          remaining: 500,
          percentage: 84.0,
          projectedPercentage: 90.0,
          health: 'warning',
          projectedHealth: 'critical',
        },
      ],
      unallocated: 1000,
    }
  }

  async getTransactions(
    teamId: string,
    params: TransactionFilter = {}
  ): Promise<TransactionsResponse> {
    await sleep(100)

    return {
      transactions: [],
      total: 0,
      page: params.page || 1,
      perPage: params.perPage || 50,
      totalPages: 0,
      hasMore: false,
    }
  }

  async healthCheck(): Promise<boolean> {
    return true
  }
}
