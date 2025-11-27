import { auth } from '@/lib/auth/server-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppSidebar } from '@/components/app-sidebar'
import { NewIncomeForm } from '@/components/income/NewIncomeForm'

export default async function NewIncomePage() {
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

  // Only TREASURER and ASSISTANT_TREASURER can create income
  if (user.role !== 'TREASURER' && user.role !== 'ASSISTANT_TREASURER') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-cream">
      <AppSidebar />

      {/* Main Content */}
      <main className="ml-64 px-8 py-8 max-w-3xl">
        <NewIncomeForm />
      </main>
    </div>
  )
}
