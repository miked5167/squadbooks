import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user and team
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { team: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all transactions for the team
    const transactions = await prisma.transaction.findMany({
      where: {
        teamId: user.teamId,
        deletedAt: null,
      },
      include: {
        category: true,
        creator: true,
        approvals: {
          include: {
            approver: true,
          },
        },
      },
      orderBy: {
        transactionDate: 'desc',
      },
    })

    // Generate CSV
    const headers = [
      'Date',
      'Type',
      'Vendor',
      'Category',
      'Amount',
      'Status',
      'Description',
      'Approved By',
      'Created By',
      'Receipt',
    ]

    const rows = transactions.map((txn) => {
      const approvedBy = txn.approvals
        .filter((a) => a.status === 'APPROVED')
        .map((a) => a.approver.name)
        .join(', ')

      return [
        txn.transactionDate.toISOString().split('T')[0], // Date (YYYY-MM-DD)
        txn.type,
        escapeCsvValue(txn.vendor),
        escapeCsvValue(txn.category.name),
        txn.amount.toString(),
        txn.status,
        escapeCsvValue(txn.description || ''),
        escapeCsvValue(approvedBy || '-'),
        escapeCsvValue(txn.creator.name),
        txn.receiptUrl ? 'Yes' : 'No',
      ]
    })

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting transactions:', error)
    return NextResponse.json(
      { error: 'Failed to export transactions' },
      { status: 500 }
    )
  }
}

// Helper function to escape CSV values
function escapeCsvValue(value: string): string {
  if (!value) return ''

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}
