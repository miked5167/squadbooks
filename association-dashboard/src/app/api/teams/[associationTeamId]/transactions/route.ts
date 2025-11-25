/**
 * Team Transactions Proxy API Route
 *
 * GET /api/teams/[associationTeamId]/transactions
 * Proxies to HuddleBooks transactions API
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - pageSize: number (default: 25, max: 100)
 * - type: 'expense' | 'income' | 'all' (default: 'all')
 * - status: 'pending' | 'approved' | 'rejected' | 'all' (default: 'all')
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { HuddleBooksClient } from '@/lib/huddlebooks/client'
import { z } from 'zod'

// Query parameter validation schema
const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
  type: z.enum(['expense', 'income', 'all']).default('all'),
  status: z.enum(['pending', 'approved', 'rejected', 'all']).default('all'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

// Transaction type (from HuddleBooks)
interface Transaction {
  id: string
  date: string
  type: 'expense' | 'income'
  vendor: string | null
  description: string
  amount: number
  category: string | null
  status: 'pending' | 'approved' | 'rejected'
  hasReceipt: boolean
  createdBy: string | null
  createdAt: string
}

// Response type
interface TransactionsResponse {
  data: {
    transactions: Transaction[]
    pagination: {
      page: number
      pageSize: number
      totalCount: number
      totalPages: number
    }
  } | null
  error: {
    code: string
    message: string
  } | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ associationTeamId: string }> }
): Promise<NextResponse<TransactionsResponse>> {
  try {
    // Authenticate request
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    // Await params (Next.js 15+)
    const resolvedParams = await params
    const associationTeamId = resolvedParams.associationTeamId
    if (!associationTeamId) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INVALID_TEAM_ID',
            message: 'Team ID is required',
          },
        },
        { status: 400 }
      )
    }

    // Fetch team with association
    const team = await prisma.associationTeam.findUnique({
      where: {
        id: associationTeamId,
      },
    })

    if (!team) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'TEAM_NOT_FOUND',
            message: 'Team not found',
          },
        },
        { status: 404 }
      )
    }

    // Check user authorization
    const associationUser = await prisma.associationUser.findFirst({
      where: {
        clerkUserId: userId,
        associationId: team.associationId,
      },
    })

    if (!associationUser) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this team',
          },
        },
        { status: 403 }
      )
    }

    // Check if team has API access token
    if (!team.apiAccessToken) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'NO_API_ACCESS',
            message: 'Team has not been connected to HuddleBooks',
          },
        },
        { status: 400 }
      )
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = querySchema.safeParse({
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      type: searchParams.get('type'),
      status: searchParams.get('status'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    })

    if (!queryParams.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INVALID_QUERY_PARAMS',
            message: queryParams.error.errors[0].message,
          },
        },
        { status: 400 }
      )
    }

    const { page, pageSize, type, status, startDate, endDate } = queryParams.data

    // Call HuddleBooks API
    try {
      const client = new HuddleBooksClient(team.apiAccessToken)
      const response = await client.getTransactions(team.teamId, {
        page,
        pageSize,
        type: type === 'all' ? undefined : type,
        status: status === 'all' ? undefined : status,
        startDate,
        endDate,
      })

      return NextResponse.json({
        data: {
          transactions: response.transactions,
          pagination: response.pagination,
        },
        error: null,
      })
    } catch (error: any) {
      console.error('Error fetching transactions from HuddleBooks:', error)

      // Handle HuddleBooks API errors
      if (error.statusCode === 401 || error.statusCode === 403) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'HUDDLEBOOKS_AUTH_FAILED',
              message: 'Failed to authenticate with HuddleBooks. Team may need to reconnect.',
            },
          },
          { status: 502 }
        )
      }

      if (error.statusCode === 404) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'TEAM_NOT_FOUND_IN_HUDDLEBOOKS',
              message: 'Team not found in HuddleBooks',
            },
          },
          { status: 404 }
        )
      }

      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'HUDDLEBOOKS_API_ERROR',
            message: 'Failed to fetch transactions from HuddleBooks',
          },
        },
        { status: 502 }
      )
    }
  } catch (error) {
    console.error('Error in transactions proxy:', error)
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch transactions',
        },
      },
      { status: 500 }
    )
  }
}
