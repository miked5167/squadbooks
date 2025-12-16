import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * GET /api/pre-season-budgets/rules
 * Fetch association rules applicable to pre-season budgets
 * Query params: associationId (optional - if not provided, tries to get from user's team)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    let associationId = searchParams.get('associationId')

    // If no associationId provided, try to get it from user's team
    if (!associationId) {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: {
          team: {
            include: {
              associationTeam: true,
            },
          },
        },
      })

      associationId = user?.team?.associationTeam?.associationId || null
    }

    if (!associationId) {
      // No association found - return empty rules
      return NextResponse.json({ rules: [], categoryLimits: {} }, { status: 200 })
    }

    // Fetch active association rules
    const rules = await prisma.associationRule.findMany({
      where: {
        associationId,
        isActive: true,
        ruleType: {
          in: ['CATEGORY_ALLOCATION_LIMIT', 'MAX_BUDGET', 'ZERO_BALANCE'],
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Extract category-specific limits
    const categoryLimits: Record<string, { maxAmount: number; ruleId: string; ruleName: string }> = {}

    rules.forEach((rule) => {
      if (rule.ruleType === 'CATEGORY_ALLOCATION_LIMIT') {
        const config = rule.config as { categoryName: string; maxAmount: number; applyToPreSeasonBudgets?: boolean }

        // Only include if explicitly applies to pre-season budgets
        if (config.applyToPreSeasonBudgets !== false) {
          categoryLimits[config.categoryName] = {
            maxAmount: config.maxAmount,
            ruleId: rule.id,
            ruleName: rule.name,
          }
        }
      }
    })

    logger.info(`Fetched ${rules.length} association rules for associationId: ${associationId}`)

    return NextResponse.json({ rules, categoryLimits }, { status: 200 })
  } catch (error) {
    logger.error('GET /api/pre-season-budgets/rules error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
