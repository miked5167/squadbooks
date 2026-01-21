import { auth } from '@/lib/auth/server-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AssociationSidebar } from '@/components/association-sidebar'
import { MobileHeader } from '@/components/MobileHeader'
import { AssociationBudgetList } from '@/components/pre-season-budget/AssociationBudgetList'

export default async function AssociationPreSeasonBudgetsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Check if user is an association admin
  const associationUser = await prisma.associationUser.findUnique({
    where: { clerkUserId: userId },
    select: {
      role: true,
      association: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!associationUser || associationUser.role !== 'association_admin') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-cream">
      <MobileHeader>
        <AssociationSidebar />
      </MobileHeader>
      <AssociationSidebar />

      <main className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
        <div className="mb-8">
          <h1 className="text-display-2 text-navy mb-2">
            Pre-Season Budget Review
          </h1>
          <p className="text-base sm:text-lg text-navy/70">
            Review and approve budgets for new teams in {associationUser.association.name}
          </p>
        </div>

        <AssociationBudgetList />
      </main>
    </div>
  )
}
