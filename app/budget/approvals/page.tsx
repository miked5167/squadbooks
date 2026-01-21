import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import { BudgetApprovalsList } from '@/components/budget/BudgetApprovalsList'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileHeader } from '@/components/MobileHeader'

export default async function BudgetApprovalsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Get user and verify role
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      role: true,
      teamId: true,
    },
  })

  if (!user || !user.teamId) {
    redirect('/dashboard')
  }

  // Only treasurers, assistant treasurers, and presidents can view
  if (user.role !== 'TREASURER' && user.role !== 'ASSISTANT_TREASURER' && user.role !== 'PRESIDENT') {
    redirect('/dashboard')
  }

  // Fetch all budget approvals for the team
  const approvals = await prisma.budgetApproval.findMany({
    where: { teamId: user.teamId },
    include: {
      team: {
        select: {
          name: true,
          level: true,
        },
      },
      creator: {
        select: {
          name: true,
        },
      },
      acknowledgments: {
        select: {
          id: true,
          familyName: true,
          acknowledged: true,
          acknowledgedAt: true,
        },
        orderBy: {
          familyName: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Convert Decimal to number for client components
  const approvalsWithNumberBudgets = approvals.map((approval) => ({
    ...approval,
    budgetTotal: Number(approval.budgetTotal),
  }))

  return (
    <div className="min-h-screen bg-cream">
      <MobileHeader>
        <AppSidebar />
      </MobileHeader>
      <AppSidebar />

      <main className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
      <div className="mb-6">
        <h1 className="text-display-2 text-navy mb-2">Budget Approvals</h1>
        <p className="text-base sm:text-lg text-navy/70">
          Track parent acknowledgments for budget approvals and financial reports
        </p>
      </div>

        {approvals.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-navy/30 mb-4" />
              <p className="text-lg font-medium text-navy/70">No budget approvals yet</p>
              <p className="text-sm text-navy/50 mt-2">
                Create your first approval request from the Budget page
              </p>
            </CardContent>
          </Card>
        ) : (
          <BudgetApprovalsList approvals={approvalsWithNumberBudgets} />
        )}
      </main>
    </div>
  )
}
