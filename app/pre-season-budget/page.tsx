import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileHeader } from '@/components/MobileHeader'
import { BudgetList } from '@/components/pre-season-budget/BudgetList'

export default function PreSeasonBudgetPage() {
  return (
    <div className="min-h-screen bg-cream">
      <MobileHeader>
        <AppSidebar />
      </MobileHeader>
      <AppSidebar />

      <main className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-display-2 text-navy mb-2">
              Pre-Season Budgets
            </h1>
            <p className="text-base sm:text-lg text-navy/70">
              Create budgets for new teams before the season starts
            </p>
          </div>
          <Link href="/pre-season-budget/new">
            <Button className="bg-gold hover:bg-gold/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Create Budget</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        </div>

        <BudgetList />
      </main>
    </div>
  )
}
