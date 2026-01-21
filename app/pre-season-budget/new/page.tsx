'use client'

import { useRouter } from 'next/navigation'
import { BudgetWizard } from '@/components/pre-season-budget/BudgetWizard'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileHeader } from '@/components/MobileHeader'

export default function NewPreSeasonBudgetPage() {
  const router = useRouter()

  const handleComplete = (budgetId: string) => {
    // Redirect to the budget detail page
    router.push(`/pre-season-budget/${budgetId}`)
  }

  return (
    <div className="min-h-screen bg-cream">
      <MobileHeader>
        <AppSidebar />
      </MobileHeader>
      <AppSidebar />

      <main className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
        <BudgetWizard onComplete={handleComplete} />
      </main>
    </div>
  )
}
