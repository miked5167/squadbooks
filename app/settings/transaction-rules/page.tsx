/**
 * Transaction Rules Settings Page
 * Configure dual approval, receipt requirements, and fraud prevention
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, Shield, AlertTriangle, Info } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'

interface TeamSettings {
  id: string
  teamId: string
  dualApprovalEnabled: boolean
  dualApprovalThreshold: number
  receiptRequired: boolean
  allowSelfReimbursement: boolean
  duplicateDetectionEnabled: boolean
  allowedPaymentMethods: string[]
  duplicateDetectionWindow: number
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'E_TRANSFER', label: 'E-Transfer' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
]

export default function TransactionRulesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<TeamSettings | null>(null)

  // Fetch settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings')
        if (!res.ok) {
          throw new Error('Failed to fetch settings')
        }
        const data = await res.json()
        setSettings(data.settings)
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load settings',
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
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      const data = await res.json()
      setSettings(data.settings)

      toast({
        title: 'Success',
        description: 'Transaction rules updated successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  function togglePaymentMethod(method: string) {
    if (!settings) return

    const methods = settings.allowedPaymentMethods.includes(method)
      ? settings.allowedPaymentMethods.filter((m) => m !== method)
      : [...settings.allowedPaymentMethods, method]

    // Ensure at least one payment method is selected
    if (methods.length === 0) {
      toast({
        title: 'Error',
        description: 'At least one payment method must be allowed',
        variant: 'destructive',
      })
      return
    }

    setSettings({ ...settings, allowedPaymentMethods: methods })
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
        <p className="text-navy/60">Failed to load settings</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-navy flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Transaction Rules
          </h2>
          <p className="text-sm text-navy/60 mt-1">
            Configure approval workflows and fraud prevention measures
          </p>
        </div>

        {/* Security Notice */}
        <Alert className="mb-6 border-golden bg-golden/5">
          <Shield className="h-4 w-4 text-golden" />
          <AlertTitle>Security & Fraud Prevention</AlertTitle>
          <AlertDescription className="text-sm">
            Some settings are enforced for fraud prevention and cannot be disabled:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Dual approval is always enabled to prevent unauthorized spending</li>
              <li>Receipt requirements are always enforced for audit compliance</li>
            </ul>
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Dual Approval */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-navy border-b border-gray-200 pb-2">
              Dual Approval
            </h3>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Dual approval requires two authorized users to approve transactions above the
                threshold amount. This prevents unauthorized spending and provides oversight.
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                id="dualApprovalEnabled"
                checked={true}
                disabled
                className="opacity-50"
              />
              <div className="flex-1">
                <Label
                  htmlFor="dualApprovalEnabled"
                  className="text-base font-medium cursor-not-allowed"
                >
                  Require Dual Approval
                </Label>
                <p className="text-sm text-navy/60">
                  This setting is enforced and cannot be disabled for fraud prevention
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="dualApprovalThreshold">
                Dual Approval Threshold (CAD) *
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-navy">$</span>
                <Input
                  id="dualApprovalThreshold"
                  type="number"
                  step="0.01"
                  min="0"
                  max="999999.99"
                  value={settings.dualApprovalThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      dualApprovalThreshold: parseFloat(e.target.value),
                    })
                  }
                  className="text-lg"
                  required
                />
              </div>
              <p className="text-sm text-navy/60 mt-1">
                Transactions at or above this amount require approval from two authorized users
              </p>
            </div>
          </div>

          {/* Receipt Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-navy border-b border-gray-200 pb-2">
              Receipt Requirements
            </h3>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                id="receiptRequired"
                checked={true}
                disabled
                className="opacity-50"
              />
              <div className="flex-1">
                <Label
                  htmlFor="receiptRequired"
                  className="text-base font-medium cursor-not-allowed"
                >
                  Require Receipts for All Transactions
                </Label>
                <p className="text-sm text-navy/60">
                  This setting is enforced and cannot be disabled for audit compliance
                </p>
              </div>
            </div>
          </div>

          {/* Self-Reimbursement */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-navy border-b border-gray-200 pb-2">
              Self-Reimbursement
            </h3>

            <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
              <Checkbox
                id="allowSelfReimbursement"
                checked={settings.allowSelfReimbursement}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, allowSelfReimbursement: checked as boolean })
                }
              />
              <div className="flex-1">
                <Label
                  htmlFor="allowSelfReimbursement"
                  className="text-base font-medium cursor-pointer"
                >
                  Allow Self-Reimbursement
                </Label>
                <p className="text-sm text-navy/60">
                  If disabled, users cannot approve their own reimbursement requests (recommended
                  for fraud prevention)
                </p>
              </div>
            </div>

            {settings.allowSelfReimbursement && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Security Warning</AlertTitle>
                <AlertDescription className="text-sm">
                  Allowing self-reimbursement increases the risk of fraud. Consider keeping this
                  disabled unless absolutely necessary for your team's workflow.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Duplicate Detection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-navy border-b border-gray-200 pb-2">
              Duplicate Detection
            </h3>

            <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
              <Checkbox
                id="duplicateDetectionEnabled"
                checked={settings.duplicateDetectionEnabled}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    duplicateDetectionEnabled: checked as boolean,
                  })
                }
              />
              <div className="flex-1">
                <Label
                  htmlFor="duplicateDetectionEnabled"
                  className="text-base font-medium cursor-pointer"
                >
                  Enable Duplicate Detection
                </Label>
                <p className="text-sm text-navy/60">
                  Warn about potential duplicate transactions with similar amounts and dates
                </p>
              </div>
            </div>

            {settings.duplicateDetectionEnabled && (
              <div>
                <Label htmlFor="duplicateDetectionWindow">Detection Window (Days)</Label>
                <Input
                  id="duplicateDetectionWindow"
                  type="number"
                  min="1"
                  max="30"
                  value={settings.duplicateDetectionWindow}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      duplicateDetectionWindow: parseInt(e.target.value),
                    })
                  }
                  required
                />
                <p className="text-sm text-navy/60 mt-1">
                  Check for duplicates within this many days of the transaction date
                </p>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-navy border-b border-gray-200 pb-2">
              Allowed Payment Methods
            </h3>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Select which payment methods are allowed for transactions. At least one method
                must be enabled.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <div
                  key={method.value}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                >
                  <Checkbox
                    id={`method-${method.value}`}
                    checked={settings.allowedPaymentMethods.includes(method.value)}
                    onCheckedChange={() => togglePaymentMethod(method.value)}
                  />
                  <Label
                    htmlFor={`method-${method.value}`}
                    className="text-base cursor-pointer"
                  >
                    {method.label}
                  </Label>
                </div>
              ))}
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
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
