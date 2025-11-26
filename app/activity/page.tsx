import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity as ActivityIcon, Clock, CheckCircle, XCircle } from 'lucide-react'
import { prisma } from '@/lib/prisma'

export default async function ActivityPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Fetch user and audit logs
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      team: {
        include: {
          auditLogs: {
            include: {
              user: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 50
          }
        }
      }
    },
  })

  if (!user) {
    redirect('/onboarding')
  }

  const activityLogs = user.team.auditLogs || []

  const getActionIcon = (action: string) => {
    if (action.includes('APPROVE')) return <CheckCircle className="w-4 h-4 text-meadow" />
    if (action.includes('REJECT')) return <XCircle className="w-4 h-4 text-red-500" />
    return <ActivityIcon className="w-4 h-4 text-navy" />
  }

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

  return (
    <div className="min-h-screen bg-cream">
      <AppSidebar />

      <main className="ml-64 px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-display-2 text-navy mb-2">Activity</h1>
          <p className="text-lg text-navy/70">View all team activity and audit logs</p>
        </div>

        {/* Activity Feed */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-navy">Recent Activity</CardTitle>
            <CardDescription>Track all changes and actions in your team account</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLogs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ActivityIcon className="w-8 h-8 text-navy/40" />
                </div>
                <h3 className="text-lg font-semibold text-navy mb-2">No activity yet</h3>
                <p className="text-navy/60 max-w-sm mx-auto">
                  Team activity and changes will appear here as actions are taken
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="mt-1">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-medium text-navy">{log.user.name}</span>
                        <span className="text-sm text-navy/60">{formatAction(log.action)}</span>
                      </div>
                      <div className="text-sm text-navy/70">
                        {log.entityType} • {log.entityId.substring(0, 8)}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-navy/50">
                        <Clock className="w-3 h-3" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
