'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus,
  Calendar,
  Users,
  DollarSign,
  Eye,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface PreSeasonBudget {
  id: string
  proposedTeamName: string
  proposedSeason: string
  teamType?: string
  ageDivision?: string
  totalBudget: number
  projectedPlayers: number
  perPlayerCost: number
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'ACTIVATED' | 'CANCELLED'
  createdAt: string
  _count: {
    parentInterests: number
  }
}

const STATUS_CONFIG = {
  DRAFT: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: Clock,
  },
  SUBMITTED: {
    label: 'Pending Approval',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: Send,
  },
  APPROVED: {
    label: 'Approved',
    color: 'bg-green-100 text-green-700 border-green-300',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-700 border-red-300',
    icon: XCircle,
  },
  ACTIVATED: {
    label: 'Team Created',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-600 border-gray-300',
    icon: XCircle,
  },
}

export function BudgetList() {
  const [budgets, setBudgets] = useState<PreSeasonBudget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBudgets()
  }, [])

  const fetchBudgets = async () => {
    try {
      const res = await fetch('/api/pre-season-budget')
      if (res.ok) {
        const data = await res.json()
        setBudgets(data.budgets || [])
      } else {
        toast.error('Failed to load budgets')
      }
    } catch (error) {
      console.error('Error fetching budgets:', error)
      toast.error('Failed to load budgets')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (budgets.length === 0) {
    return (
      <Card className="border-dashed border-2 border-navy/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-navy/5 p-4 mb-4">
            <Plus className="w-8 h-8 text-navy/40" />
          </div>
          <h3 className="text-lg font-medium text-navy mb-2">
            No Pre-Season Budgets Yet
          </h3>
          <p className="text-sm text-navy/60 mb-6 text-center max-w-md">
            Create your first pre-season budget to plan your team's finances before
            the season starts. Share it with prospective parents and get started!
          </p>
          <Link href="/pre-season-budget/new">
            <Button className="bg-gold hover:bg-gold/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Budget
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((budget) => {
          const StatusIcon = STATUS_CONFIG[budget.status].icon

          return (
            <Link key={budget.id} href={`/pre-season-budget/${budget.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg text-navy line-clamp-1">
                      {budget.proposedTeamName}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={`${STATUS_CONFIG[budget.status].color} border ml-2`}
                    >
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {STATUS_CONFIG[budget.status].label}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2 text-navy/60">
                    <Calendar className="w-3 h-3" />
                    {budget.proposedSeason}
                    {budget.ageDivision && (
                      <>
                        <span>•</span>
                        <span>{budget.ageDivision}</span>
                      </>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-navy/60 mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-xs">Total Budget</span>
                      </div>
                      <p className="font-bold text-navy">
                        {formatCurrency(budget.totalBudget)}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-navy/60 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="text-xs">Players</span>
                      </div>
                      <p className="font-medium text-navy">
                        {budget.projectedPlayers}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-navy/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-navy/60">Per Player</span>
                      <span className="font-bold text-gold">
                        {formatCurrency(budget.perPlayerCost)}
                      </span>
                    </div>
                  </div>

                  {budget.status === 'APPROVED' && budget._count.parentInterests > 0 && (
                    <div className="pt-3 border-t border-navy/10">
                      <div className="flex items-center gap-2 text-sm">
                        <Eye className="w-4 h-4 text-green-600" />
                        <span className="text-navy/70">
                          {budget._count.parentInterests} parent
                          {budget._count.parentInterests !== 1 ? 's' : ''} interested
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-navy/40">
                    Created {formatDate(budget.createdAt)}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
