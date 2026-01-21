import { auth } from '@/lib/auth/server-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { AssociationSidebar } from '@/components/association-sidebar'
import { MobileHeader } from '@/components/MobileHeader'
import { AssociationBudgetReview } from '@/components/pre-season-budget/AssociationBudgetReview'

export default async function AssociationBudgetReviewPage({
  params,
}: {
  params: { id: string }
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Check if user is an association admin
  const associationUser = await prisma.associationUser.findUnique({
    where: { clerkUserId: userId },
    select: {
      associationId: true,
      role: true,
    },
  })

  if (!associationUser || associationUser.role !== 'association_admin') {
    redirect('/dashboard')
  }

  // Get the budget
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
    },
  })

  if (!budget) {
    redirect('/association/pre-season-budgets')
  }

  // Verify budget belongs to this association
  if (budget.associationId !== associationUser.associationId) {
    redirect('/association/pre-season-budgets')
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
      <MobileHeader>
        <AssociationSidebar />
      </MobileHeader>
      <AssociationSidebar />

      <main className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
        <div className="mb-6">
          <Link href="/association/pre-season-budgets">
            <Button variant="ghost" className="text-navy/70 hover:text-navy mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Budgets
            </Button>
          </Link>
        </div>

        <AssociationBudgetReview budget={budgetData} />
      </main>
    </div>
  )
}
