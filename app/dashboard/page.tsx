import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppNav } from '@/components/app-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, Plus, DollarSign, List, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Fetch user and team data
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { team: true },
  })

  if (!user) {
    redirect('/sign-in')
  }

  // Fetch approved expenses for actual spending
  const approvedExpenses = await prisma.transaction.findMany({
    where: {
      teamId: user.teamId,
      type: 'EXPENSE',
      status: 'APPROVED',
      deletedAt: null,
    },
  })

  // Fetch pending approvals count
  const pendingApprovalsCount = await prisma.approval.count({
    where: {
      teamId: user.teamId,
      status: 'PENDING',
    },
  })

  // Calculate stats from real data
  const totalBudget = Number(user.team.budgetTotal)
  const spent = approvedExpenses.reduce((sum, txn) => sum + Number(txn.amount), 0)
  const remaining = totalBudget - spent

  const stats = {
    totalBudget,
    spent,
    remaining,
    pending: pendingApprovalsCount,
  }

  const spentPercentage = (stats.spent / stats.totalBudget) * 100
  const remainingPercentage = (stats.remaining / stats.totalBudget) * 100

  return (
    <div className="min-h-screen bg-cream">
      <AppNav />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-display-2 text-navy mb-2">Dashboard</h1>
          <p className="text-lg text-navy/70">Welcome to your team financial dashboard</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/expenses/new"
            className="group bg-white p-6 rounded-lg shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-meadow/20"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-meadow/10 rounded-lg flex items-center justify-center group-hover:bg-meadow/20 transition-colors">
                <Plus className="w-6 h-6 text-meadow" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-navy/30 group-hover:text-meadow group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <h3 className="text-lg font-semibold text-navy mb-1">Add Expense</h3>
            <p className="text-sm text-navy/60">Record a new team expense with receipt</p>
          </Link>

          <Link
            href="/income/new"
            className="group bg-white p-6 rounded-lg shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-golden/20"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-golden/10 rounded-lg flex items-center justify-center group-hover:bg-golden/20 transition-colors">
                <DollarSign className="w-6 h-6 text-golden" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-navy/30 group-hover:text-golden group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <h3 className="text-lg font-semibold text-navy mb-1">Add Income</h3>
            <p className="text-sm text-navy/60">Record registration fees, donations, or sponsorships</p>
          </Link>

          <Link
            href="/transactions"
            className="group bg-white p-6 rounded-lg shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-navy/20"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-navy/10 rounded-lg flex items-center justify-center group-hover:bg-navy/20 transition-colors">
                <List className="w-6 h-6 text-navy" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-navy/30 group-hover:text-navy group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <h3 className="text-lg font-semibold text-navy mb-1">View Transactions</h3>
            <p className="text-sm text-navy/60">See all team financial activity</p>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardDescription className="text-navy/60">Total Budget</CardDescription>
              <CardTitle className="text-3xl text-navy">${stats.totalBudget.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-navy h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardDescription className="text-navy/60">Spent</CardDescription>
              <CardTitle className="text-3xl text-navy">${stats.spent.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-navy/70">{spentPercentage.toFixed(1)}% of budget</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardDescription className="text-navy/60">Remaining</CardDescription>
              <CardTitle className="text-3xl text-meadow">${stats.remaining.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="w-4 h-4 text-meadow" />
                <span className="text-navy/70">{remainingPercentage.toFixed(1)}% available</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardDescription className="text-navy/60">Pending Approvals</CardDescription>
              <CardTitle className="text-3xl text-golden">{stats.pending}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm">
                <Clock className="w-4 h-4 text-golden" />
                <span className="text-navy/70">Awaiting review</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Overview */}
        <Card className="border-0 shadow-card mb-8">
          <CardHeader>
            <CardTitle className="text-navy">Budget Overview</CardTitle>
            <CardDescription>See how your spending compares to your budget</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Example category */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-meadow rounded-full"></div>
                    <span className="font-medium text-navy">Ice Time</span>
                  </div>
                  <span className="text-sm text-navy/70">$0 / $4,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-meadow h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-golden rounded-full"></div>
                    <span className="font-medium text-navy">Equipment</span>
                  </div>
                  <span className="text-sm text-navy/70">$0 / $2,500</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-golden h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-navy rounded-full"></div>
                    <span className="font-medium text-navy">Tournaments</span>
                  </div>
                  <span className="text-sm text-navy/70">$0 / $2,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-navy h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>

              <Button asChild className="w-full bg-navy hover:bg-navy-medium text-white">
                <Link href="/budget">
                  View Full Budget
                  <ArrowUpRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-navy">Recent Transactions</CardTitle>
                <CardDescription>Your team's latest financial activity</CardDescription>
              </div>
              <Button asChild variant="outline" className="border-navy/20 text-navy hover:bg-navy/5">
                <Link href="/transactions">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-navy/40" />
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2">No transactions yet</h3>
              <p className="text-navy/60 mb-6 max-w-sm mx-auto">
                Create your first expense or income to get started tracking your team's finances
              </p>
              <div className="flex gap-3 justify-center">
                <Button asChild className="bg-meadow hover:bg-meadow/90 text-white">
                  <Link href="/expenses/new">
                    <Plus className="mr-2 w-4 h-4" />
                    Add Expense
                  </Link>
                </Button>
                <Button asChild className="bg-golden hover:bg-golden/90 text-navy">
                  <Link href="/income/new">
                    <Plus className="mr-2 w-4 h-4" />
                    Add Income
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
