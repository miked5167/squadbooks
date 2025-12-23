import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Clock, Calendar, FileText, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { AcknowledgeButton } from './AcknowledgeButton'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileHeader } from '@/components/MobileHeader'

export default async function BudgetApprovalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const { id } = await params

  // Get user
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      name: true,
      role: true,
      teamId: true,
    },
  })

  if (!user || !user.teamId) {
    redirect('/dashboard')
  }

  // Fetch approval
  const approval = await prisma.budgetApproval.findUnique({
    where: { id },
    include: {
      team: {
        select: {
          name: true,
          level: true,
        },
      },
      acknowledgments: {
        select: {
          id: true,
          userId: true,
          familyName: true,
          acknowledged: true,
          acknowledgedAt: true,
        },
      },
    },
  })

  if (!approval) {
    notFound()
  }

  // Find user's acknowledgment
  const userAcknowledgment = approval.acknowledgments.find(
    (a) => a.userId === user.id
  )

  // Check if user has permission to view
  const canView =
    userAcknowledgment ||
    user.role === 'TREASURER' ||
    user.role === 'ASSISTANT_TREASURER' ||
    user.role === 'PRESIDENT'

  if (!canView || user.teamId !== approval.teamId) {
    redirect('/dashboard')
  }

  const acknowledgedCount = approval.acknowledgments.filter((a) => a.acknowledged).length
  const totalCount = approval.acknowledgments.length
  const progressPercentage = totalCount > 0 ? (acknowledgedCount / totalCount) * 100 : 0

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'INITIAL':
        return <Badge variant="default">Initial Season Budget</Badge>
      case 'REVISION':
        return <Badge variant="secondary">Budget Revision</Badge>
      case 'REPORT':
        return <Badge className="bg-blue-500">Financial Report</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const isExpired = approval.expiresAt && new Date(approval.expiresAt) < new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader>
        <AppSidebar />
      </MobileHeader>
      <AppSidebar />

      <main className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              {getTypeBadge(approval.approvalType)}
            </div>
            <h1 className="text-display-2 text-navy mb-2">
              {approval.team.name}
            </h1>
            <p className="text-base sm:text-lg text-navy/70">{approval.season}</p>
          </div>

          {/* Status Alert */}
          {userAcknowledgment?.acknowledged ? (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>You acknowledged this budget on{' '}
                  {userAcknowledgment.acknowledgedAt &&
                    format(new Date(userAcknowledgment.acknowledgedAt), 'MMMM d, yyyy \'at\' h:mm a')}
                </strong>
                <br />
                Thank you for reviewing and acknowledging receipt of this budget.
              </AlertDescription>
            </Alert>
          ) : isExpired ? (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>This acknowledgment request has expired.</strong>
                <br />
                The deadline was {approval.expiresAt && format(new Date(approval.expiresAt), 'MMMM d, yyyy')}.
                Please contact the treasurer if you need to acknowledge this budget.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-6 bg-orange-50 border-orange-200">
              <Clock className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Please review and acknowledge this budget.</strong>
                <br />
                Your acknowledgment confirms you have reviewed the budget information below.
                {approval.expiresAt && (
                  <>
                    {' '}Deadline: {format(new Date(approval.expiresAt), 'MMMM d, yyyy')}.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Budget Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-navy">Budget Summary</CardTitle>
                {approval.description && (
                  <CardDescription className="text-base">{approval.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="bg-navy/5 rounded-lg p-6 mb-4">
                  <p className="text-sm text-navy/60 mb-2">Total Budget Amount</p>
                  <p className="text-4xl font-bold text-navy">
                    ${Number(approval.budgetTotal).toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-navy/60 mb-1">Season</p>
                    <p className="font-medium text-navy">{approval.season}</p>
                  </div>
                  <div>
                    <p className="text-navy/60 mb-1">Team</p>
                    <p className="font-medium text-navy">{approval.team.name}</p>
                  </div>
                  <div>
                    <p className="text-navy/60 mb-1">Created</p>
                    <p className="font-medium text-navy">
                      {format(new Date(approval.createdAt), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  {approval.expiresAt && (
                    <div>
                      <p className="text-navy/60 mb-1">Deadline</p>
                      <p className="font-medium text-navy">
                        {format(new Date(approval.expiresAt), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  )}
                </div>

                {/* TODO: Add category breakdown when available */}
                {/* <div className="mt-6">
                  <h3 className="font-semibold text-navy mb-3">Category Breakdown</h3>
                  <div className="space-y-2">
                    // Category items
                  </div>
                </div> */}
              </CardContent>
            </Card>

            {/* Acknowledgment Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-navy">Acknowledgment Status</CardTitle>
                <CardDescription>
                  Track how many families have reviewed and acknowledged this budget
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-semibold text-navy">Progress</p>
                    <p className="text-sm text-navy/70">
                      {acknowledgedCount} of {totalCount} families ({Math.round(progressPercentage)}%)
                    </p>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                {approval.status === 'COMPLETED' && approval.completedAt && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>All families have acknowledged this budget!</strong>
                      <br />
                      Completed on {format(new Date(approval.completedAt), 'MMMM d, yyyy \'at\' h:mm a')}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Acknowledge Button */}
            {userAcknowledgment && !userAcknowledgment.acknowledged && !isExpired && (
              <AcknowledgeButton approvalId={id} />
            )}

            {/* Information Note */}
            <Card className="bg-cream border-navy/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-navy/60 mt-0.5" />
                  <div className="text-sm text-navy/70">
                    <p className="font-semibold text-navy mb-1">What does acknowledgment mean?</p>
                    <p>
                      By acknowledging this budget, you confirm that you have reviewed the budget
                      information provided. This is for informational purposes and helps ensure all
                      team families are aware of the team's financial plan.
                    </p>
                    <p className="mt-2">
                      <strong>Note:</strong> Once acknowledged, this action cannot be undone.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
