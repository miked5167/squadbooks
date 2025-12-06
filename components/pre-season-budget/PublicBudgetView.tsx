'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Users,
  DollarSign,
  Calendar,
  Trophy,
  TrendingUp,
  Eye,
  CheckCircle2,
} from 'lucide-react'
import { ParentInterestForm } from './ParentInterestForm'

interface PublicBudgetViewProps {
  budget: {
    id: string
    proposedTeamName: string
    proposedSeason: string
    teamType: string | null
    ageDivision: string | null
    competitiveLevel: string | null
    totalBudget: number
    projectedPlayers: number
    perPlayerCost: number
    publicSlug: string
    viewCount: number
    allocations: Array<{
      id: string
      allocated: number
      category: {
        id: string
        name: string
        heading: string
        color: string | null
      }
    }>
    _count: {
      parentInterests: number
    }
  }
}

export function PublicBudgetView({ budget }: PublicBudgetViewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Group allocations by heading
  const allocationsByHeading = budget.allocations.reduce(
    (acc, alloc) => {
      const heading = alloc.category.heading || 'Other'
      if (!acc[heading]) {
        acc[heading] = []
      }
      acc[heading].push(alloc)
      return acc
    },
    {} as Record<string, typeof budget.allocations>
  )

  const headings = Object.keys(allocationsByHeading).sort()

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-white">
      {/* Header */}
      <div className="bg-navy text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="bg-gold text-navy font-medium">
              {budget.proposedSeason}
            </Badge>
            {budget.ageDivision && (
              <Badge variant="outline" className="border-white/30 text-white">
                {budget.ageDivision}
              </Badge>
            )}
            {budget.competitiveLevel && (
              <Badge variant="outline" className="border-white/30 text-white">
                {budget.competitiveLevel}
              </Badge>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {budget.proposedTeamName}
          </h1>
          <p className="text-xl text-white/80 max-w-2xl">
            Transparent budget for the upcoming season. See exactly where your registration
            fees go.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-gold/30 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-navy/60 mb-1">Per Player Cost</p>
                  <p className="text-3xl font-bold text-gold">
                    {formatCurrency(budget.perPlayerCost)}
                  </p>
                </div>
                <div className="rounded-full bg-gold/10 p-4">
                  <DollarSign className="w-8 h-8 text-gold" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-navy/20 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-navy/60 mb-1">Expected Roster Size</p>
                  <p className="text-3xl font-bold text-navy">
                    {budget.projectedPlayers}
                  </p>
                  <p className="text-xs text-navy/50">players</p>
                </div>
                <div className="rounded-full bg-navy/10 p-4">
                  <Users className="w-8 h-8 text-navy" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-navy/20 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-navy/60 mb-1">Total Season Budget</p>
                  <p className="text-3xl font-bold text-navy">
                    {formatCurrency(budget.totalBudget)}
                  </p>
                </div>
                <div className="rounded-full bg-navy/10 p-4">
                  <TrendingUp className="w-8 h-8 text-navy" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Social Proof */}
        {budget._count.parentInterests > 0 && (
          <Card className="mb-8 border-green-200 bg-green-50/50">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-600 p-2">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-green-900">
                    {budget._count.parentInterests}{' '}
                    {budget._count.parentInterests === 1 ? 'family has' : 'families have'}{' '}
                    already expressed interest
                  </p>
                  <p className="text-sm text-green-700">
                    Join them and be part of the {budget.proposedTeamName} community
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Budget Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-navy mb-2">Budget Breakdown</h2>
              <p className="text-navy/70 mb-6">
                Complete transparency on how your registration fees are allocated
              </p>
            </div>

            {headings.map((heading) => {
              const headingAllocations = allocationsByHeading[heading]
              const headingTotal = headingAllocations.reduce(
                (sum, a) => sum + a.allocated,
                0
              )
              const headingPercentage = (headingTotal / budget.totalBudget) * 100

              return (
                <Card key={heading} className="shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-navy">{heading}</CardTitle>
                      <div className="text-right">
                        <p className="text-xl font-bold text-navy">
                          {formatCurrency(headingTotal)}
                        </p>
                        <p className="text-xs text-navy/60">
                          {headingPercentage.toFixed(1)}% of budget
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {headingAllocations.map((alloc) => {
                      const percentage = (alloc.allocated / budget.totalBudget) * 100
                      return (
                        <div key={alloc.id}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-navy/80">
                              {alloc.category.name}
                            </span>
                            <span className="text-sm font-bold text-navy">
                              {formatCurrency(alloc.allocated)}
                            </span>
                          </div>
                          <Progress
                            value={percentage}
                            className="h-2"
                            style={
                              {
                                '--progress-background': alloc.category.color || '#D4AF37',
                              } as React.CSSProperties
                            }
                          />
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })}

            {/* What's Included */}
            <Card className="bg-gradient-to-br from-navy/5 to-gold/5 border-navy/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-navy">
                  <Trophy className="w-5 h-5 text-gold" />
                  What's Included
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-navy/80">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                    <span>All ice time and facility fees for games and practices</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                    <span>League registration and tournament entry fees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                    <span>Team uniforms and equipment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                    <span>Qualified coaching staff and support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                    <span>Team activities and season-end celebrations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Interest Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <ParentInterestForm budgetSlug={budget.publicSlug} />

              {/* Trust Indicators */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-sm text-navy/60">
                  <Eye className="w-4 h-4" />
                  <span>{budget.viewCount} views</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-navy/60">
                  <Calendar className="w-4 h-4" />
                  <span>Season: {budget.proposedSeason}</span>
                </div>
                {budget.teamType && (
                  <div className="flex items-center gap-2 text-sm text-navy/60">
                    <Trophy className="w-4 h-4" />
                    <span>{budget.teamType}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <Card className="mt-12 border-navy/20">
          <CardHeader>
            <CardTitle className="text-navy">Frequently Asked Questions</CardTitle>
            <CardDescription>Common questions about this team budget</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-navy mb-1">
                Is this the final cost per player?
              </h4>
              <p className="text-sm text-navy/70">
                This is an estimated budget based on projected roster size. The final cost may
                vary slightly based on the actual number of players who register. Additional
                costs like personal equipment are not included.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-navy mb-1">
                When do I need to register and pay?
              </h4>
              <p className="text-sm text-navy/70">
                Expressing interest through this form is not a commitment. The coach will
                contact you with registration details and payment schedules once the team is
                confirmed.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-navy mb-1">Can the budget change?</h4>
              <p className="text-sm text-navy/70">
                This budget has been approved by the association and represents our commitment
                to transparent financial management. Any significant changes would require
                parent notification and association approval.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
