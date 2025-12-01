import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Clock, Calendar, FileText } from 'lucide-react'
import { format } from 'date-fns'

export default async function BudgetApprovalsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Get user and verify role
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      role: true,
      teamId: true,
    },
  })

  if (!user || !user.teamId) {
    redirect('/dashboard')
  }

  // Only treasurers, assistant treasurers, and presidents can view
  if (user.role !== 'TREASURER' && user.role !== 'ASSISTANT_TREASURER' && user.role !== 'PRESIDENT') {
    redirect('/dashboard')
  }

  // Fetch all budget approvals for the team
  const approvals = await prisma.budgetApproval.findMany({
    where: { teamId: user.teamId },
    include: {
      team: {
        select: {
          name: true,
          level: true,
        },
      },
      creator: {
        select: {
          name: true,
        },
      },
      acknowledgments: {
        select: {
          id: true,
          familyName: true,
          acknowledged: true,
          acknowledgedAt: true,
        },
        orderBy: {
          familyName: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-500">Completed</Badge>
      case 'EXPIRED':
        return <Badge variant="destructive">Expired</Badge>
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'INITIAL':
        return <Badge variant="default">Initial Budget</Badge>
      case 'REVISION':
        return <Badge variant="secondary">Budget Revision</Badge>
      case 'REPORT':
        return <Badge className="bg-blue-500">Financial Report</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  return (
    <div className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
      <div className="mb-6">
        <h1 className="text-display-2 text-navy mb-2">Budget Approvals</h1>
        <p className="text-base sm:text-lg text-navy/70">
          Track parent acknowledgments for budget approvals and financial reports
        </p>
      </div>

      {approvals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-navy/30 mb-4" />
            <p className="text-lg font-medium text-navy/70">No budget approvals yet</p>
            <p className="text-sm text-navy/50 mt-2">
              Create your first approval request from the Budget page
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {approvals.map((approval) => {
            const acknowledgedCount = approval.acknowledgments.filter((a) => a.acknowledged).length
            const totalCount = approval.acknowledgments.length
            const progressPercentage = totalCount > 0 ? (acknowledgedCount / totalCount) * 100 : 0
            const acknowledged = approval.acknowledgments.filter((a) => a.acknowledged)
            const pending = approval.acknowledgments.filter((a) => !a.acknowledged)

            return (
              <Card key={approval.id} className="overflow-hidden">
                <CardHeader className="bg-cream border-b border-navy/10">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {getTypeBadge(approval.approvalType)}
                        {getStatusBadge(approval.status)}
                      </div>
                      <CardTitle className="text-navy">
                        {approval.team.name} - {approval.season}
                      </CardTitle>
                      {approval.description && (
                        <CardDescription className="mt-1">{approval.description}</CardDescription>
                      )}
                    </div>
                    <div className="text-sm text-navy/60">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(approval.createdAt), 'MMM d, yyyy')}
                      </div>
                      {approval.expiresAt && (
                        <div className="flex items-center gap-2 mt-1 text-orange-600">
                          <Clock className="h-4 w-4" />
                          Due: {format(new Date(approval.expiresAt), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  {/* Budget Total */}
                  <div className="mb-6 p-4 bg-navy/5 rounded-lg">
                    <p className="text-sm text-navy/60 mb-1">Budget Total</p>
                    <p className="text-2xl font-bold text-navy">
                      ${Number(approval.budgetTotal).toLocaleString()}
                    </p>
                  </div>

                  {/* Progress Section */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-semibold text-navy">
                        Acknowledgment Progress
                      </p>
                      <p className="text-sm text-navy/70">
                        {acknowledgedCount} of {totalCount} families ({Math.round(progressPercentage)}%)
                      </p>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    {approval.status === 'COMPLETED' && approval.completedAt && (
                      <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Completed on {format(new Date(approval.completedAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    )}
                  </div>

                  {/* Two Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Acknowledged */}
                    <div>
                      <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Acknowledged ({acknowledged.length})
                      </h3>
                      {acknowledged.length === 0 ? (
                        <p className="text-sm text-navy/50 italic">No acknowledgments yet</p>
                      ) : (
                        <ul className="space-y-2">
                          {acknowledged.map((ack) => (
                            <li
                              key={ack.id}
                              className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-green-50 rounded-lg border border-green-200"
                            >
                              <span className="text-sm font-medium text-navy">
                                {ack.familyName}
                              </span>
                              {ack.acknowledgedAt && (
                                <span className="text-xs text-navy/60 mt-1 sm:mt-0">
                                  {format(new Date(ack.acknowledgedAt), 'MMM d, h:mm a')}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Pending */}
                    <div>
                      <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        Pending ({pending.length})
                      </h3>
                      {pending.length === 0 ? (
                        <p className="text-sm text-green-600 italic flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          All families have acknowledged
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {pending.map((ack) => (
                            <li
                              key={ack.id}
                              className="p-3 bg-orange-50 rounded-lg border border-orange-200"
                            >
                              <span className="text-sm font-medium text-navy">
                                {ack.familyName}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
