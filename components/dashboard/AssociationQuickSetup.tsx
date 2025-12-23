'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  Shield,
  FileText,
  Users,
  Settings,
} from 'lucide-react'

interface SetupItem {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
  href: string
  badge?: string
}

interface AssociationQuickSetupProps {
  associationId: string
}

export function AssociationQuickSetup({ associationId }: AssociationQuickSetupProps) {
  const [setupItems, setSetupItems] = useState<SetupItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSetupStatus = async () => {
      try {
        const response = await fetch(`/api/associations/${associationId}/setup-status`)
        if (response.ok) {
          const data = await response.json()
          setSetupItems(buildSetupItems(data))
        }
      } catch (error) {
        console.error('Error fetching setup status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSetupStatus()
  }, [associationId])

  const buildSetupItems = (status: any): SetupItem[] => {
    const items: SetupItem[] = []

    // Coach Compensation Policy
    items.push({
      id: 'coach-compensation',
      title: 'Coach Compensation Limits',
      description: 'Set caps for coach compensation by age group and skill level',
      icon: <Shield className="h-5 w-5" />,
      completed: status.coachCompensationPolicyConfigured || false,
      href: `/association/${associationId}/rules/coach-compensation`,
      badge: 'Optional',
    })

    // Receipt Policy (if not configured during onboarding)
    if (!status.receiptPolicyConfigured) {
      items.push({
        id: 'receipt-policy',
        title: 'Receipt Requirements',
        description: 'Configure receipt thresholds and grace periods',
        icon: <FileText className="h-5 w-5" />,
        completed: false,
        href: `/association/${associationId}/settings?tab=receipts`,
        badge: 'Recommended',
      })
    }

    // Budget Governance
    if (!status.budgetGovernanceConfigured) {
      items.push({
        id: 'budget-governance',
        title: 'Budget Governance Rules',
        description: 'Set approval requirements for budget changes',
        icon: <Users className="h-5 w-5" />,
        completed: false,
        href: `/association/${associationId}/settings?tab=governance`,
        badge: 'Recommended',
      })
    }

    // Dashboard Thresholds
    if (!status.dashboardConfigured) {
      items.push({
        id: 'dashboard-config',
        title: 'Dashboard Thresholds',
        description: 'Customize health score warnings and critical levels',
        icon: <Settings className="h-5 w-5" />,
        completed: false,
        href: `/association/${associationId}/settings?tab=dashboard`,
      })
    }

    return items
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quick Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const incompleteItems = setupItems.filter((item) => !item.completed)

  if (incompleteItems.length === 0) {
    return null // Hide widget when all optional items are completed
  }

  const completedCount = setupItems.filter((item) => item.completed).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quick Setup</CardTitle>
            <CardDescription>
              Complete optional configurations to enhance your association management
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {completedCount}/{setupItems.length} Complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {incompleteItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <div className="flex-shrink-0">
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </div>

              <div className="flex-shrink-0 text-gray-600">{item.icon}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-gray-900">{item.title}</div>
                  {item.badge && (
                    <Badge variant={item.badge === 'Optional' ? 'outline' : 'secondary'} className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-600">{item.description}</div>
              </div>

              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
