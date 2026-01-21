'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Calendar,
  Users,
  DollarSign,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Share2,
  Eye,
  Mail,
  Phone,
  MessageSquare,
  Rocket,
  Copy,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface CoachBudgetDetailProps {
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
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'ACTIVATED' | 'CANCELLED'
    publicSlug: string
    viewCount: number
    createdAt: string
    submittedAt: string | null
    approvedAt: string | null
    rejectedAt: string | null
    associationNotes: string | null
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
    parentInterests: Array<{
      id: string
      parentName: string
      email: string
      phone: string | null
      playerName: string
      playerAge: number | null
      comments: string | null
      createdAt: string
    }>
  }
}

const STATUS_CONFIG = {
  DRAFT: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: Edit,
    description: 'Budget is being prepared and can be edited',
  },
  SUBMITTED: {
    label: 'Pending Review',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: Send,
    description: 'Submitted to association for approval',
  },
  APPROVED: {
    label: 'Approved',
    color: 'bg-green-100 text-green-700 border-green-300',
    icon: CheckCircle2,
    description: 'Approved by association - ready to share with parents',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-700 border-red-300',
    icon: XCircle,
    description: 'Requires revision before resubmission',
  },
  ACTIVATED: {
    label: 'Team Created',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    icon: CheckCircle2,
    description: 'Team has been created and budget imported',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: XCircle,
    description: 'Budget has been cancelled',
  },
}

export function CoachBudgetDetail({ budget }: CoachBudgetDetailProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showActivateDialog, setShowActivateDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const publicUrl = `${window.location.origin}/public-budget/${budget.publicSlug}`

  const copyPublicLink = () => {
    navigator.clipboard.writeText(publicUrl)
    toast.success('Link copied to clipboard!')
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/pre-season-budget/${budget.id}/submit`, {
        method: 'POST',
      })

      if (res.ok) {
        toast.success('Budget submitted for association approval!')
        router.refresh()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to submit budget')
      }
    } catch (error) {
      console.error('Error submitting budget:', error)
      toast.error('Failed to submit budget')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/pre-season-budget/${budget.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Budget deleted successfully')
        router.push('/pre-season-budget')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to delete budget')
      }
    } catch (error) {
      console.error('Error deleting budget:', error)
      toast.error('Failed to delete budget')
    } finally {
      setLoading(false)
      setShowDeleteDialog(false)
    }
  }

  const handleActivate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/pre-season-budget/${budget.id}/activate`, {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        toast.success('Team created successfully!')
        router.push(`/dashboard?teamId=${data.teamId}`)
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to activate team')
      }
    } catch (error) {
      console.error('Error activating team:', error)
      toast.error('Failed to activate team')
    } finally {
      setLoading(false)
      setShowActivateDialog(false)
    }
  }

  const StatusIcon = STATUS_CONFIG[budget.status].icon

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-display-2 text-navy mb-2">{budget.proposedTeamName}</h1>
            <div className="flex flex-wrap gap-2 text-navy/70">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
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
            className={`${STATUS_CONFIG[budget.status].color} border text-sm px-3 py-1.5`}
          >
            <StatusIcon className="w-4 h-4 mr-1.5" />
            {STATUS_CONFIG[budget.status].label}
          </Badge>
        </div>

        <p className="text-navy/70 mb-4">{STATUS_CONFIG[budget.status].description}</p>

        {/* Association Notes (if rejected) */}
        {budget.status === 'REJECTED' && budget.associationNotes && (
          <Card className="bg-red-50 border-red-200 mb-4">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-900 mb-1">Association Feedback</p>
                  <p className="text-sm text-red-800">{budget.associationNotes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {budget.status === 'DRAFT' && (
            <>
              <Button onClick={handleSubmit} disabled={loading} className="bg-gold hover:bg-gold/90">
                <Send className="w-4 h-4 mr-2" />
                Submit for Approval
              </Button>
              <Link href={`/pre-season-budget/${budget.id}/edit`}>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Budget
                </Button>
              </Link>
            </>
          )}

          {budget.status === 'APPROVED' && (
            <>
              <Button onClick={copyPublicLink} className="bg-gold hover:bg-gold/90">
                <Copy className="w-4 h-4 mr-2" />
                Copy Public Link
              </Button>
              <Link href={publicUrl} target="_blank">
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Public Page
                </Button>
              </Link>
              {budget.parentInterests.length >= Math.ceil(budget.projectedPlayers * 0.8) && (
                <Button
                  onClick={() => setShowActivateDialog(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Activate Team
                </Button>
              )}
            </>
          )}

          {['DRAFT', 'REJECTED'].includes(budget.status) && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={loading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Budget Breakdown</TabsTrigger>
          <TabsTrigger value="interests">
            Parent Interests
            {budget.parentInterests.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-gold text-navy">
                {budget.parentInterests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-gold" />
                  <span className="text-sm text-navy/60">Per Player</span>
                </div>
                <p className="text-2xl font-bold text-gold">
                  {formatCurrency(budget.perPlayerCost)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-navy" />
                  <span className="text-sm text-navy/60">Projected Players</span>
                </div>
                <p className="text-2xl font-bold text-navy">{budget.projectedPlayers}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-navy" />
                  <span className="text-sm text-navy/60">Total Budget</span>
                </div>
                <p className="text-2xl font-bold text-navy">
                  {formatCurrency(budget.totalBudget)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Eye className="w-5 h-5 text-navy" />
                  <span className="text-sm text-navy/60">Page Views</span>
                </div>
                <p className="text-2xl font-bold text-navy">{budget.viewCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-navy p-2 mt-0.5">
                  <Edit className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-navy">Created</p>
                  <p className="text-sm text-navy/60">{formatDate(budget.createdAt)}</p>
                </div>
              </div>

              {budget.submittedAt && (
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-blue-600 p-2 mt-0.5">
                    <Send className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-navy">Submitted for Review</p>
                    <p className="text-sm text-navy/60">{formatDate(budget.submittedAt)}</p>
                  </div>
                </div>
              )}

              {budget.approvedAt && (
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-green-600 p-2 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-navy">Approved</p>
                    <p className="text-sm text-navy/60">{formatDate(budget.approvedAt)}</p>
                  </div>
                </div>
              )}

              {budget.rejectedAt && (
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-red-600 p-2 mt-0.5">
                    <XCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-navy">Rejected</p>
                    <p className="text-sm text-navy/60">{formatDate(budget.rejectedAt)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Public Link (if approved) */}
          {budget.status === 'APPROVED' && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <Share2 className="w-5 h-5" />
                  Public Budget Link
                </CardTitle>
                <CardDescription>Share this link with prospective parents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-white rounded-md border border-green-200">
                  <code className="flex-1 text-sm text-navy truncate">{publicUrl}</code>
                  <Button size="sm" variant="ghost" onClick={copyPublicLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-green-800">
                  Parents can view the complete budget breakdown and express interest through
                  this link.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="breakdown" className="mt-6 space-y-4">
          {headings.map((heading) => {
            const headingAllocations = allocationsByHeading[heading]
            const headingTotal = headingAllocations.reduce((sum, a) => sum + a.allocated, 0)
            const headingPercentage = (headingTotal / budget.totalBudget) * 100

            return (
              <Card key={heading}>
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
        </TabsContent>

        <TabsContent value="interests" className="mt-6">
          {budget.parentInterests.length === 0 ? (
            <Card className="border-dashed border-2 border-navy/20">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-navy/5 p-4 mb-4">
                  <Users className="w-8 h-8 text-navy/40" />
                </div>
                <h3 className="text-lg font-medium text-navy mb-2">No Parent Interests Yet</h3>
                <p className="text-sm text-navy/60 text-center max-w-md">
                  {budget.status === 'APPROVED'
                    ? 'Share your public budget link with prospective parents to start receiving interest submissions.'
                    : 'Parent interests will appear here once your budget is approved and you share the public link.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Interest Stats */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-900">
                        {budget.parentInterests.length}
                      </p>
                      <p className="text-sm text-green-800">
                        {budget.parentInterests.length === 1
                          ? 'family interested'
                          : 'families interested'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-800 mb-1">
                        Target: {Math.ceil(budget.projectedPlayers * 0.8)} to activate
                      </p>
                      <Progress
                        value={
                          (budget.parentInterests.length /
                            Math.ceil(budget.projectedPlayers * 0.8)) *
                          100
                        }
                        className="h-2 w-32"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Interest List */}
              <div className="space-y-3">
                {budget.parentInterests.map((interest) => (
                  <Card key={interest.id}>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-navy">{interest.parentName}</h4>
                            <p className="text-sm text-navy/60">
                              Player: {interest.playerName}
                              {interest.playerAge && ` (Age ${interest.playerAge})`}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {formatDate(interest.createdAt).split(' at ')[0]}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-navy/70">
                            <Mail className="w-4 h-4" />
                            <a
                              href={`mailto:${interest.email}`}
                              className="hover:text-gold hover:underline"
                            >
                              {interest.email}
                            </a>
                          </div>
                          {interest.phone && (
                            <div className="flex items-center gap-2 text-navy/70">
                              <Phone className="w-4 h-4" />
                              <a
                                href={`tel:${interest.phone}`}
                                className="hover:text-gold hover:underline"
                              >
                                {interest.phone}
                              </a>
                            </div>
                          )}
                        </div>

                        {interest.comments && (
                          <div className="pt-3 border-t border-navy/10">
                            <div className="flex items-start gap-2 text-sm">
                              <MessageSquare className="w-4 h-4 text-navy/60 mt-0.5 flex-shrink-0" />
                              <p className="text-navy/70 italic">{interest.comments}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this pre-season budget. This action cannot be undone.
              {budget.parentInterests.length > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Warning: {budget.parentInterests.length} parent
                  {budget.parentInterests.length === 1 ? ' has' : 's have'} expressed interest
                  in this team.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Budget'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Team Confirmation Dialog */}
      <AlertDialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Team?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create <strong>{budget.proposedTeamName}</strong> in HuddleBooks and
              import all budget allocations. The budget will be locked and can no longer be
              edited.
              <span className="block mt-3 text-green-700 font-medium">
                {budget.parentInterests.length} interested{' '}
                {budget.parentInterests.length === 1 ? 'parent' : 'parents'} will receive
                registration instructions via email.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivate}
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Activating...' : 'Activate Team'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
