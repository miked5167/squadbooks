import { auth } from '@/lib/auth/server-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileHeader } from '@/components/MobileHeader'
import { NewExpenseForm } from '@/components/expenses/NewExpenseForm'

export default async function NewExpensePage() {
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

  // Only TREASURER and ASSISTANT_TREASURER can create expenses
  if (user.role !== 'TREASURER' && user.role !== 'ASSISTANT_TREASURER') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-cream">
      <MobileHeader>
        <AppSidebar />
      </MobileHeader>
      <AppSidebar />

      {/* Main Content */}
      <main className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8 max-w-3xl">
        <NewExpenseForm />
      </main>
    </div>
  )
}
