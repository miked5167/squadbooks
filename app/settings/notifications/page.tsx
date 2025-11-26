/**
 * Notifications Settings Page
 * Configure email notification preferences
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, Bell, Mail } from 'lucide-react'
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert'

interface NotificationSettings {
  id: string
  userId: string
  teamId: string
  newExpenseSubmitted: boolean
  approvalRequired: boolean
  budgetThresholdWarning: boolean
  missingReceiptReminder: boolean
  monthlySummary: boolean
}

export default function NotificationsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings | null>(null)

  // Fetch settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings/notifications')
        if (!res.ok) {
          throw new Error('Failed to fetch notification settings')
        }
        const data = await res.json()
        setSettings(data.settings)
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load notification settings',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [toast])

  // Handle save
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!settings) return

    setSaving(true)

    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newExpenseSubmitted: settings.newExpenseSubmitted,
          approvalRequired: settings.approvalRequired,
          budgetThresholdWarning: settings.budgetThresholdWarning,
          missingReceiptReminder: settings.missingReceiptReminder,
          monthlySummary: settings.monthlySummary,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save notification settings')
      }

      const data = await res.json()
      setSettings(data.settings)

      toast({
        title: 'Success',
        description: 'Notification preferences updated successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save notification settings',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-navy/60">Failed to load notification settings</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-navy flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Notification Preferences
          </h2>
          <p className="text-sm text-navy/60 mt-1">
            Choose which email notifications you want to receive
          </p>
        </div>

        <Alert className="mb-6">
          <Mail className="h-4 w-4" />
          <AlertDescription className="text-sm">
            These settings control email notifications sent to your registered email address.
            You can adjust them at any time.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Transaction Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-navy border-b border-gray-200 pb-2">
              Transaction Notifications
            </h3>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1 pr-4">
                <Label
                  htmlFor="newExpenseSubmitted"
                  className="text-base font-medium cursor-pointer"
                >
                  New Expense Submitted
                </Label>
                <p className="text-sm text-navy/60 mt-1">
                  Notify me when a new expense is submitted for approval (Treasurers only)
                </p>
              </div>
              <Switch
                id="newExpenseSubmitted"
                checked={settings.newExpenseSubmitted}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, newExpenseSubmitted: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1 pr-4">
                <Label
                  htmlFor="approvalRequired"
                  className="text-base font-medium cursor-pointer"
                >
                  Approval Required
                </Label>
                <p className="text-sm text-navy/60 mt-1">
                  Notify me when my approval is needed for a transaction
                </p>
              </div>
              <Switch
                id="approvalRequired"
                checked={settings.approvalRequired}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, approvalRequired: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1 pr-4">
                <Label
                  htmlFor="missingReceiptReminder"
                  className="text-base font-medium cursor-pointer"
                >
                  Missing Receipt Reminders
                </Label>
                <p className="text-sm text-navy/60 mt-1">
                  Remind me to upload receipts for transactions missing documentation
                </p>
              </div>
              <Switch
                id="missingReceiptReminder"
                checked={settings.missingReceiptReminder}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, missingReceiptReminder: checked })
                }
              />
            </div>
          </div>

          {/* Budget Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-navy border-b border-gray-200 pb-2">
              Budget Notifications
            </h3>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1 pr-4">
                <Label
                  htmlFor="budgetThresholdWarning"
                  className="text-base font-medium cursor-pointer"
                >
                  Budget Threshold Warnings
                </Label>
                <p className="text-sm text-navy/60 mt-1">
                  Alert me when categories approach or exceed their budgeted amounts (80%+)
                </p>
              </div>
              <Switch
                id="budgetThresholdWarning"
                checked={settings.budgetThresholdWarning}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, budgetThresholdWarning: checked })
                }
              />
            </div>
          </div>

          {/* Summary Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-navy border-b border-gray-200 pb-2">
              Summary Reports
            </h3>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1 pr-4">
                <Label
                  htmlFor="monthlySummary"
                  className="text-base font-medium cursor-pointer"
                >
                  Monthly Summary
                </Label>
                <p className="text-sm text-navy/60 mt-1">
                  Receive a monthly summary of team finances and budget performance
                </p>
              </div>
              <Switch
                id="monthlySummary"
                checked={settings.monthlySummary}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, monthlySummary: checked })
                }
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
