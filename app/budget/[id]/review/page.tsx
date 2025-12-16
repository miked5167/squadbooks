/**
 * Coach Budget Review Page
 *
 * Allows coaches to review and approve/reject budgets
 */

import { auth } from '@/lib/auth/server-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getBudgetWithVersions } from '@/lib/budget-workflow/queries'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileHeader } from '@/components/MobileHeader'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { BudgetStatusBadge } from '@/components/budget/BudgetStatusBadge'
import { VersionBadge } from '@/components/budget/VersionBadge'
import { BudgetAllocationsTable } from '@/components/budget/BudgetAllocationsTable'
import { CoachReviewActions } from '@/components/budget/CoachReviewActions'
import { BudgetStatus, UserRole } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

// Roles that can review budgets
const COACH_ROLES = [UserRole.PRESIDENT, UserRole.BOARD_MEMBER]

export default async function CoachBudgetReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: budgetId } = await params
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      team: true,
    },
  })

  if (!user) {
    redirect('/onboarding')
  }

  // Check authorization - must be coach/president/board member
  if (!COACH_ROLES.includes(user.role)) {
    redirect('/dashboard')
  }

  // Get budget with versions
  const budget = await getBudgetWithVersions(budgetId)

  if (!budget) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader>
          <AppSidebar />
        </MobileHeader>
        <AppSidebar />
        <main className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-navy mb-2">Budget Not Found</h2>
            <p className="text-navy/60 mb-6">The budget you&apos;re looking for doesn&apos;t exist.</p>
            <Button asChild>
              <Link href="/budget">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Budgets
              </Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Check authorization - must belong to same team
  if (budget.teamId !== user.teamId) {
    redirect('/dashboard')
  }

  // Get team season lifecycle state
  const teamSeason = await prisma.teamSeason.findUnique({
    where: {
      teamId_seasonLabel: {
        teamId: budget.teamId,
        seasonLabel: budget.season,
      },
    },
  })

  // Get available actions from lifecycle state machine
  let availableActions: string[] = []
  if (teamSeason) {
    const { getAvailableActions } = await import('@/lib/services/team-season-lifecycle')
    availableActions = await getAvailableActions(teamSeason.id, user.id)
  }

  // Check if budget is in reviewable state (either old status or new lifecycle state)
  const canReview = budget.status === BudgetStatus.REVIEW || availableActions.includes('APPROVE_BUDGET') || availableActions.includes('REQUEST_BUDGET_CHANGES')

  if (!canReview) {
    redirect(`/budget/${budget.id}`)
  }

  // Get current version
  const currentVersion = budget.currentVersion
  if (!currentVersion) {
    redirect('/budget')
  }

  // Check if already approved by this user
  const isAlreadyApproved = !!currentVersion.coachApprovedAt

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader>
        <AppSidebar />
      </MobileHeader>
      <AppSidebar />

      <main className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" asChild size="sm">
              <Link href="/budget">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Budgets
              </Link>
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-navy mb-2">
                Review Budget: {budget.season} Season
              </h1>
              <p className="text-navy/60">{user.team?.name}</p>
            </div>
            <BudgetStatusBadge status={budget.status} showDescription size="lg" />
          </div>

          {/* Version Badge */}
          <VersionBadge
            versionNumber={currentVersion.versionNumber}
            changeSummary={currentVersion.changeSummary}
            createdAt={currentVersion.createdAt}
            showChangeSummary
          />
        </div>

        {/* Review Instructions */}
        {!isAlreadyApproved && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-blue-900">
                <AlertCircle className="w-4 h-4" />
                Budget Review Required
              </CardTitle>
              <CardDescription className="text-blue-700">
                Please review the budget allocations below. You can approve the budget to move it forward,
                or request changes from the treasurer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-blue-800">
                <p><strong>If you approve:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Budget will move to &quot;Team Approved&quot; status</li>
                  <li>Treasurer can then present it to parents</li>
                  <li>You can optionally add notes about your approval</li>
                </ul>
                <p className="mt-3"><strong>If you request changes:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Budget will return to &quot;Draft&quot; status</li>
                  <li>Treasurer will be notified of your requested changes</li>
                  <li>You must provide notes explaining what needs to change</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Already Approved Message */}
        {isAlreadyApproved && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-green-900">
                <AlertCircle className="w-4 h-4" />
                Budget Already Approved
              </CardTitle>
              <CardDescription className="text-green-700">
                You approved this budget on {new Date(currentVersion.coachApprovedAt!).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {currentVersion.coachNotes && ` with the following notes: "${currentVersion.coachNotes}"`}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Budget Breakdown - Main Content */}
          <div className="lg:col-span-8 space-y-6">
            <BudgetAllocationsTable
              allocations={currentVersion.allocations}
              showCard
              showNotes={true}
            />
          </div>

          {/* Sidebar - Budget Summary & Actions */}
          <div className="lg:col-span-4 space-y-6">
            {/* Budget Summary */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-navy">
                  Budget Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-navy/70">Total Budget</span>
                    <span className="text-lg font-bold text-navy">
                      ${currentVersion.totalBudget.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-navy/70">Categories</span>
                    <span className="text-sm font-semibold text-navy">
                      {currentVersion.allocations.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-navy/70">Version</span>
                    <span className="text-sm font-semibold text-navy">
                      {currentVersion.versionNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-navy/70">Submitted</span>
                    <span className="text-sm font-semibold text-navy">
                      {new Date(currentVersion.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Actions */}
            {!isAlreadyApproved && (
              <CoachReviewActions
                budgetId={budget.id}
                versionNumber={currentVersion.versionNumber}
                userId={user.id}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
