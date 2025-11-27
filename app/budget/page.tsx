import { auth } from '@/lib/auth/server-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppSidebar } from '@/components/app-sidebar'
import { BudgetPageClient } from '@/components/budget/BudgetPageClient'

export default async function BudgetPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Get user and check role
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  })

  if (!user) {
    redirect('/onboarding')
  }

  // Check if user is treasurer (authorized to manage budget)
  const isTreasurer = user.role === 'TREASURER' || user.role === 'ASSISTANT_TREASURER'

  return (
    <div className="min-h-screen bg-cream">
      <AppSidebar />

      <main className="ml-64 px-8 py-8">
        <BudgetPageClient isTreasurer={isTreasurer} />
      </main>
    </div>
  )
}
