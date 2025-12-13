import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DollarSign, TrendingUp, Wallet, Info, Eye } from 'lucide-react'
import { KpiCard } from './KpiCard'
import { ParentBudgetOverview } from './ParentBudgetOverview'
import { TransparencyCard } from './TransparencyCard'
import { TransactionsPreviewTable } from './TransactionsPreviewTable'

interface Transaction {
  id: string
  transactionDate: Date
  vendor: string
  categoryName: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DRAFT'
  receiptUrl: string | null
}

interface CategoryData {
  id: string
  name: string
  spent: number
  budget: number
}

interface ParentDashboardProps {
  teamName: string
  season: string
  totalIncome: number
  totalExpenses: number
  netPosition: number
  budgetTotal: number
  categories: CategoryData[]
  transactions: Transaction[]
  treasurerName?: string
  treasurerEmail?: string
  treasurerPhone?: string
}

export function ParentDashboard({
  teamName,
  season,
  totalIncome,
  totalExpenses,
  netPosition,
  budgetTotal,
  categories,
  transactions,
  treasurerName,
  treasurerEmail,
  treasurerPhone,
}: ParentDashboardProps) {
  const isNetPositive = netPosition >= 0

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-navy">Team Finances</h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Read-only
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">
                    You're viewing financial data in read-only mode. Contact your team treasurer
                    to request changes.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-base text-navy/60">
            {teamName} • {season}
          </p>
        </div>
        {/* Optional: Download Report button - disabled for now */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-navy/20" disabled>
            Download Report
          </Button>
        </div>
      </div>

      {/* Top KPI Overview - 3 tiles for parents */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <KpiCard
                  title="Total Collected"
                  value={`$${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  subtitle="Registration, fundraising, sponsorships"
                  icon={DollarSign}
                  trend={{
                    value: 'Income',
                  }}
                  badge={{
                    label: 'Income',
                    variant: 'success',
                  }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-sm">
                All approved income transactions for this season
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <KpiCard
                  title="Total Spent"
                  value={`$${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  subtitle={`of $${budgetTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} budgeted`}
                  icon={TrendingUp}
                  trend={{
                    value: `${budgetTotal > 0 ? ((totalExpenses / budgetTotal) * 100).toFixed(1) : 0}% of budget`,
                  }}
                  badge={{
                    label: 'Expenses',
                    variant: 'default',
                  }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-sm">
                All approved expenses for this season
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <KpiCard
                  title="Cash Position"
                  value={`${isNetPositive ? '+' : ''}$${Math.abs(netPosition).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  subtitle="Income minus expenses"
                  icon={Wallet}
                  trend={{
                    value: isNetPositive ? 'Positive balance' : 'Deficit',
                    isPositive: isNetPositive,
                  }}
                  badge={{
                    label: isNetPositive ? 'Healthy' : 'Deficit',
                    variant: isNetPositive ? 'success' : 'warning',
                  }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-sm">
                Current financial position (income - expenses). Updates as transactions are approved.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900 mb-1">
            Data Updates Automatically
          </p>
          <p className="text-sm text-blue-700">
            All financial information updates in real-time as your team treasurer approves
            transactions. You're always viewing the latest data.
          </p>
        </div>
      </div>

      {/* Main Content Grid - Budget + Transparency */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Budget Overview - 8 cols on desktop */}
        <div className="lg:col-span-8">
          <ParentBudgetOverview
            categories={categories}
            totalSpent={totalExpenses}
            totalBudget={budgetTotal}
          />
        </div>

        {/* Transparency Card - 4 cols on desktop */}
        <div className="lg:col-span-4">
          <TransparencyCard
            treasurerName={treasurerName}
            treasurerEmail={treasurerEmail}
            treasurerPhone={treasurerPhone}
          />
        </div>
      </div>

      {/* Recent Transactions - Full Width */}
      <TransactionsPreviewTable
        transactions={transactions}
        readOnly={true}
      />
    </div>
  )
}
