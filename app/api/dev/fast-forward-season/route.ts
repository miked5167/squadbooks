import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import {
  TransactionType,
  TransactionStatus,
  CategoryType,
} from '@prisma/client'
import { MANDATORY_RECEIPT_THRESHOLD } from '@/lib/constants/validation'

/**
 * POST /api/dev/fast-forward-season
 * Generate 9 months of realistic transactions for end-of-season demo
 * Protected by DEV_MODE check - only works in development
 */
export async function POST(request: NextRequest) {
  try {
    // Check if dev mode is enabled
    if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
      return NextResponse.json(
        { error: 'Dev mode not enabled' },
        { status: 403 }
      )
    }

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { teamId } = body

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId required in request body' },
        { status: 400 }
      )
    }

    // Fetch team with related data
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        categories: true,
        players: {
          include: { family: true },
        },
        users: {
          where: { role: 'TREASURER' },
        },
      },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    if (team.users.length === 0) {
      return NextResponse.json(
        { error: 'Team must have a treasurer to generate transactions' },
        { status: 400 }
      )
    }

    const treasurerId = team.users[0].id

    // Date helpers
    const SEASON_START = new Date('2025-09-01T00:00:00Z')
    const NOW = new Date('2026-04-15T00:00:00Z') // Near end of season
    const addDays = (date: Date, days: number) =>
      new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
    const randomInt = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min
    const randomDateBetween = (start: Date, end: Date) =>
      new Date(
        start.getTime() + Math.random() * (end.getTime() - start.getTime())
      )
    const randomChoice = <T,>(arr: T[]): T =>
      arr[Math.floor(Math.random() * arr.length)]

    // Vendor pools
    const VENDORS = {
      arenas: [
        'Newmarket Arena',
        'Aurora Community Centre',
        'East Gwillimbury Complex',
      ],
      retail: [
        'Canadian Tire',
        "Sport Chek",
        'Pro Hockey Life',
        'Source for Sports',
      ],
      hotels: [
        'Holiday Inn',
        'Marriott Suites',
        'Hampton Inn',
        'Best Western',
      ],
      gas: ['Petro-Canada', 'Shell', 'Esso', 'Husky'],
    }

    const fundraisingEvents = [
      'Bottle drive',
      '50/50 draw',
      'Raffle night',
      'Pub night fundraiser',
    ]

    // Helper to find category by heading
    const findCategory = (heading: string) =>
      team.categories.find((c) => c.heading === heading)

    // Receipt URL helper
    const receiptUrl = (date: Date) =>
      `https://storage.googleapis.com/demo-receipts/${teamId}/${date.toISOString()}.pdf`

    // Generate transactions
    const transactions: any[] = []
    let totalIncome = 0
    let totalExpenses = 0

    // 1. Registration income (September) - one per player
    const registrationCat = findCategory('Fundraising & Events')
    if (registrationCat && team.players.length > 0) {
      for (const player of team.players) {
        const fee = randomInt(1800, 2500)
        const tx = await prisma.transaction.create({
          data: {
            teamId,
            type: TransactionType.INCOME,
            status: TransactionStatus.APPROVED,
            amount: fee,
            categoryId: registrationCat.id,
            vendor: 'Registration Fees',
            description: `Season registration for ${player.firstName} ${player.lastName}`,
            transactionDate: randomDateBetween(
              SEASON_START,
              addDays(SEASON_START, 30)
            ),
            createdBy: treasurerId,
            createdAt: SEASON_START,
          },
        })
        transactions.push(tx)
        totalIncome += fee
      }
    }

    // 2. Equipment purchases (September)
    const equipmentCat = findCategory('Equipment & Uniforms')
    if (equipmentCat) {
      const purchases = randomInt(3, 6)
      for (let i = 0; i < purchases; i++) {
        const amount = randomInt(500, 2500)
        const tx = await prisma.transaction.create({
          data: {
            teamId,
            type: TransactionType.EXPENSE,
            status: TransactionStatus.APPROVED,
            amount,
            categoryId: equipmentCat.id,
            vendor: randomChoice(VENDORS.retail),
            description: 'Team equipment purchase',
            transactionDate: randomDateBetween(
              SEASON_START,
              addDays(SEASON_START, 30)
            ),
            receiptUrl: receiptUrl(SEASON_START),
            createdBy: treasurerId,
            createdAt: SEASON_START,
          },
        })
        transactions.push(tx)
        totalExpenses += amount
      }
    }

    // 3. Monthly ice time (September - April)
    const iceCat = findCategory('Ice & Facilities')
    if (iceCat) {
      let monthStart = new Date('2025-09-01T00:00:00Z')
      while (monthStart < NOW) {
        const amount = randomInt(2500, 4000)
        const txDate = randomDateBetween(monthStart, addDays(monthStart, 7))

        const tx = await prisma.transaction.create({
          data: {
            teamId,
            type: TransactionType.EXPENSE,
            status: TransactionStatus.APPROVED,
            amount,
            categoryId: iceCat.id,
            vendor: randomChoice(VENDORS.arenas),
            description: 'Monthly ice rental',
            transactionDate: txDate,
            receiptUrl: receiptUrl(txDate),
            createdBy: treasurerId,
            createdAt: txDate,
          },
        })
        transactions.push(tx)
        totalExpenses += amount

        monthStart = addDays(monthStart, 30)
      }
    }

    // 4. Tournament fees (Oct, Nov, Dec, Jan, Feb)
    const tournamentCat = findCategory('Tournament & League Fees')
    if (tournamentCat) {
      const tournamentDates = [
        new Date('2025-10-10T00:00:00Z'),
        new Date('2025-11-10T00:00:00Z'),
        new Date('2025-12-10T00:00:00Z'),
        new Date('2026-01-10T00:00:00Z'),
        new Date('2026-02-10T00:00:00Z'),
      ]

      for (const tourneyDate of tournamentDates) {
        const amount = randomInt(1500, 3500)
        const tx = await prisma.transaction.create({
          data: {
            teamId,
            type: TransactionType.EXPENSE,
            status: TransactionStatus.APPROVED,
            amount,
            categoryId: tournamentCat.id,
            vendor: 'Tournament Organizer',
            description: 'Tournament entry fee',
            transactionDate: tourneyDate,
            receiptUrl: receiptUrl(tourneyDate),
            createdBy: treasurerId,
            createdAt: addDays(tourneyDate, -7),
          },
        })
        transactions.push(tx)
        totalExpenses += amount
      }
    }

    // 5. Weekly referee fees (October - April)
    const refCat = findCategory('Coaching & Officials')
    if (refCat) {
      let gameDate = new Date('2025-10-05T00:00:00Z')
      while (gameDate < NOW) {
        const amount = randomInt(120, 220)
        const tx = await prisma.transaction.create({
          data: {
            teamId,
            type: TransactionType.EXPENSE,
            status: TransactionStatus.APPROVED,
            amount,
            categoryId: refCat.id,
            vendor: 'Game Officials',
            description: 'Referee fees',
            transactionDate: gameDate,
            createdBy: treasurerId,
            createdAt: gameDate,
          },
        })
        transactions.push(tx)
        totalExpenses += amount
        gameDate = addDays(gameDate, 7)
      }
    }

    // 6. Travel expenses (hotel + gas for tournaments)
    const travelCat = findCategory('Travel & Accommodation')
    if (travelCat) {
      const travelWeekends = [
        new Date('2025-10-18T00:00:00Z'),
        new Date('2025-11-22T00:00:00Z'),
        new Date('2025-12-15T00:00:00Z'),
        new Date('2026-01-24T00:00:00Z'),
        new Date('2026-02-21T00:00:00Z'),
      ]

      for (const weekend of travelWeekends) {
        // Hotel
        const hotelAmount = randomInt(2500, 4500)
        const hotelTx = await prisma.transaction.create({
          data: {
            teamId,
            type: TransactionType.EXPENSE,
            status: TransactionStatus.APPROVED,
            amount: hotelAmount,
            categoryId: travelCat.id,
            vendor: randomChoice(VENDORS.hotels),
            description: 'Tournament hotel accommodation',
            transactionDate: weekend,
            receiptUrl: receiptUrl(weekend),
            createdBy: treasurerId,
            createdAt: addDays(weekend, -14),
          },
        })
        transactions.push(hotelTx)
        totalExpenses += hotelAmount

        // Gas
        const gasAmount = randomInt(800, 1500)
        const gasTx = await prisma.transaction.create({
          data: {
            teamId,
            type: TransactionType.EXPENSE,
            status: TransactionStatus.APPROVED,
            amount: gasAmount,
            categoryId: travelCat.id,
            vendor: randomChoice(VENDORS.gas),
            description: 'Team travel fuel',
            transactionDate: addDays(weekend, -1),
            receiptUrl: receiptUrl(addDays(weekend, -1)),
            createdBy: treasurerId,
            createdAt: addDays(weekend, -1),
          },
        })
        transactions.push(gasTx)
        totalExpenses += gasAmount
      }
    }

    // 7. Fundraising income (every 3 weeks)
    if (registrationCat) {
      let fundraisingDate = new Date('2025-10-05T00:00:00Z')

      while (fundraisingDate < NOW) {
        const amount = randomInt(500, 1500)
        const tx = await prisma.transaction.create({
          data: {
            teamId,
            type: TransactionType.INCOME,
            status: TransactionStatus.APPROVED,
            amount,
            categoryId: registrationCat.id,
            vendor: randomChoice(fundraisingEvents),
            description: 'Fundraising income',
            transactionDate: fundraisingDate,
            createdBy: treasurerId,
            createdAt: fundraisingDate,
          },
        })
        transactions.push(tx)
        totalIncome += amount
        fundraisingDate = addDays(fundraisingDate, 21)
      }
    }

    // 8. Add a few pending transactions
    const expenseCategories = team.categories.filter(
      (c) => c.type === CategoryType.EXPENSE
    )
    for (let i = 0; i < 3; i++) {
      const anyCat = randomChoice(expenseCategories)
      const amount = randomInt(150, 800)
      const txDate = randomDateBetween(addDays(NOW, -21), NOW)

      const tx = await prisma.transaction.create({
        data: {
          teamId,
          type: TransactionType.EXPENSE,
          status: TransactionStatus.PENDING,
          amount,
          categoryId: anyCat.id,
          vendor: randomChoice([...VENDORS.retail, ...VENDORS.gas]),
          description: 'Pending expense awaiting approval',
          transactionDate: txDate,
          receiptUrl:
            amount >= MANDATORY_RECEIPT_THRESHOLD
              ? receiptUrl(txDate)
              : undefined,
          createdBy: treasurerId,
          createdAt: txDate,
        },
      })
      transactions.push(tx)
    }

    const netBalance = totalIncome - totalExpenses
    const budgetUsed =
      totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0

    logger.info(
      `[DEV MODE] Fast-forward season for team ${teamId}: ${transactions.length} transactions generated by user ${userId}`
    )

    return NextResponse.json(
      {
        success: true,
        teamId,
        teamName: team.name,
        generated: {
          transactions: transactions.length,
          families: team.players.filter(
            (p, i, arr) => arr.findIndex((x) => x.familyId === p.familyId) === i
          ).length,
          players: team.players.length,
        },
        seasonStats: {
          totalIncome,
          totalExpenses,
          netBalance,
          budgetUsed,
        },
        message: `Season fast-forwarded to April 2026 - ${transactions.length} transactions generated`,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('POST /api/dev/fast-forward-season error', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
