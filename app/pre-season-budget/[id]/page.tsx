import { auth } from '@/lib/auth/server-auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { CoachBudgetDetail } from '@/components/pre-season-budget/CoachBudgetDetail'

export default async function CoachBudgetDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Fetch budget with allocations and parent interests
  const budget = await prisma.preSeasonBudget.findUnique({
    where: { id: params.id },
    include: {
      allocations: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              heading: true,
              color: true,
            },
          },
        },
        orderBy: {
          category: {
            sortOrder: 'asc',
          },
        },
      },
      parentInterests: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!budget) {
    notFound()
  }

  // Verify user is the creator
  if (budget.createdByClerkId !== userId) {
    redirect('/pre-season-budget')
  }

  // Convert Decimals to numbers for client component
  const budgetData = {
    ...budget,
    totalBudget: Number(budget.totalBudget),
    perPlayerCost: Number(budget.perPlayerCost),
    allocations: budget.allocations.map((alloc) => ({
      ...alloc,
      allocated: Number(alloc.allocated),
    })),
  }

  return (
    <div className="min-h-screen bg-cream">
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/pre-season-budget">
            <Button variant="ghost" className="text-navy/70 hover:text-navy">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Budgets
            </Button>
          </Link>
        </div>

        <CoachBudgetDetail budget={budgetData} />
      </main>
    </div>
  )
}
