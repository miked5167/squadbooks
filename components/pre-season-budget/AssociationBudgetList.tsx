'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  Users,
  DollarSign,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface PreSeasonBudget {
  id: string
  proposedTeamName: string
  proposedSeason: string
  teamType?: string
  ageDivision?: string
  competitiveLevel?: string
  totalBudget: number
  projectedPlayers: number
  perPlayerCost: number
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'ACTIVATED' | 'CANCELLED'
  createdAt: string
  allocations: Array<{
    allocated: number
    category: {
      name: string
      heading: string
    }
  }>
  _count: {
    parentInterests: number
  }
}

const STATUS_CONFIG = {
  SUBMITTED: {
    label: 'Pending Review',
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
}

export function AssociationBudgetList() {
  const [budgets, setBudgets] = useState<PreSeasonBudget[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('SUBMITTED')

  useEffect(() => {
    fetchBudgets(activeTab as any)
  }, [activeTab])

  const fetchBudgets = async (status?: string) => {
    setLoading(true)
    try {
      const url = status
        ? `/api/pre-season-budget/association?status=${status}`
        : '/api/pre-season-budget/association'

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setBudgets(data.budgets || [])
      } else if (res.status === 403) {
        toast.error('You do not have permission to view association budgets')
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

  const pendingCount = budgets.filter((b) => b.status === 'SUBMITTED').length

  const renderBudgetCard = (budget: PreSeasonBudget) => {
    const StatusIcon = STATUS_CONFIG[budget.status as keyof typeof STATUS_CONFIG]?.icon || Clock

    return (
      <Link key={budget.id} href={`/association/pre-season-budgets/${budget.id}`}>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <CardTitle className="text-lg text-navy line-clamp-1 mb-1">
                  {budget.proposedTeamName}
                </CardTitle>
                <div className="flex flex-wrap gap-2 text-sm text-navy/60">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {budget.proposedSeason}
                  </div>
                  {budget.ageDivision && (
                    <>
                      <span>•</span>
                      <span>{budget.ageDivision}</span>
                    </>
                  )}
                  {budget.competitiveLevel && (
                    <>
                      <span>•</span>
                      <span>{budget.competitiveLevel}</span>
                    </>
                  )}
                </div>
              </div>
              <Badge
                variant="outline"
                className={`${STATUS_CONFIG[budget.status as keyof typeof STATUS_CONFIG]?.color || 'bg-gray-100'} border ml-2 flex-shrink-0`}
              >
                <StatusIcon className="w-3 h-3 mr-1" />
                {STATUS_CONFIG[budget.status as keyof typeof STATUS_CONFIG]?.label || budget.status}
              </Badge>
            </div>
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

            {budget.status === 'SUBMITTED' && (
              <div className="pt-3 border-t border-navy/10">
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-navy/70 font-medium">
                    Awaiting your review
                  </span>
                </div>
              </div>
            )}

            <div className="text-xs text-navy/40">
              Submitted {formatDate(budget.createdAt)}
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      {pendingCount > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-full bg-blue-600 p-3">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-navy">
                {pendingCount} Budget{pendingCount !== 1 ? 's' : ''} Awaiting Review
              </p>
              <p className="text-sm text-navy/70">
                Teams are waiting for your approval to proceed
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="SUBMITTED">
            Pending Review
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-blue-600 text-white">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="SUBMITTED" className="mt-6">
          {budgets.length === 0 ? (
            <Card className="border-dashed border-2 border-navy/20">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-navy/5 p-4 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-navy/40" />
                </div>
                <h3 className="text-lg font-medium text-navy mb-2">
                  No Pending Budgets
                </h3>
                <p className="text-sm text-navy/60 text-center max-w-md">
                  All submitted budgets have been reviewed. New budgets awaiting
                  approval will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgets.map(renderBudgetCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="APPROVED" className="mt-6">
          {budgets.length === 0 ? (
            <Card className="border-dashed border-2 border-navy/20">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-navy/5 p-4 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-navy/40" />
                </div>
                <h3 className="text-lg font-medium text-navy mb-2">
                  No Approved Budgets
                </h3>
                <p className="text-sm text-navy/60 text-center max-w-md">
                  Budgets you approve will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgets.map(renderBudgetCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="REJECTED" className="mt-6">
          {budgets.length === 0 ? (
            <Card className="border-dashed border-2 border-navy/20">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-navy/5 p-4 mb-4">
                  <XCircle className="w-8 h-8 text-navy/40" />
                </div>
                <h3 className="text-lg font-medium text-navy mb-2">
                  No Rejected Budgets
                </h3>
                <p className="text-sm text-navy/60 text-center max-w-md">
                  Budgets you reject will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgets.map(renderBudgetCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
