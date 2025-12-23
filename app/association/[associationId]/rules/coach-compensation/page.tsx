'use client'

/**
 * Coach Compensation Policy Management Page
 *
 * Allows association admins to:
 * - Enable/disable coach compensation limits
 * - Configure enforcement mode
 * - Set cap matrix by age group × skill level
 * - Manage category scope
 * - Review and approve exception requests
 */

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Check, Clock, Save, X } from 'lucide-react'
import { toast } from 'sonner'

import {
  getCoachCompPolicy,
  updatePolicySettings,
  getSystemCategories,
  getPendingExceptions,
  type PolicySettingsInput,
} from './actions'

import { CapMatrixEditor } from './components/CapMatrixEditor'
import { ExceptionRequestsTable } from './components/ExceptionRequestsTable'
import { CategoryScopeSelector } from './components/CategoryScopeSelector'
import { EnforcementModeSelector } from './components/EnforcementModeSelector'

export default function CoachCompensationPolicyPage() {
  const params = useParams()
  const associationId = params.associationId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Policy state
  const [policyId, setPolicyId] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [enforcementMode, setEnforcementMode] = useState<'WARN_ONLY' | 'REQUIRE_EXCEPTION' | 'BLOCK'>('WARN_ONLY')
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [approachingThreshold, setApproachingThreshold] = useState(0.90)

  // Data
  const [categories, setCategories] = useState<any[]>([])
  const [exceptions, setExceptions] = useState<any[]>([])
  const [limits, setLimits] = useState<any[]>([])

  // Load initial data
  useEffect(() => {
    loadData()
  }, [associationId])

  async function loadData() {
    setLoading(true)
    try {
      // Load policy
      const policyResult = await getCoachCompPolicy(associationId)
      if (policyResult.success && policyResult.data) {
        const policy = policyResult.data
        setPolicyId(policy.ruleId)
        setEnabled(policy.isActive)
        setEnforcementMode(policy.config.enforcementMode)
        setCategoryIds(policy.config.categoryIds)
        setApproachingThreshold(policy.config.approachingThreshold)
        setLimits(policy.limits)
      }

      // Load categories
      const categoriesResult = await getSystemCategories()
      if (categoriesResult.success) {
        setCategories(categoriesResult.data || [])
      }

      // Load exceptions
      const exceptionsResult = await getPendingExceptions(associationId)
      if (exceptionsResult.success) {
        setExceptions(exceptionsResult.data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load policy data')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveSettings() {
    setSaving(true)
    try {
      const settings: PolicySettingsInput = {
        enabled,
        enforcementMode,
        categoryIds,
        approachingThreshold,
        effectiveDate: new Date(),
      }

      const result = await updatePolicySettings(associationId, settings)

      if (result.success) {
        toast.success('Policy settings saved successfully')
        loadData() // Reload to get updated data
      } else {
        toast.error(result.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading policy...</div>
        </div>
      </div>
    )
  }

  const pendingCount = exceptions.filter(ex => ex.status === 'PENDING').length

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Coach Compensation Limits</h1>
            <p className="text-muted-foreground mt-2">
              Manage association-wide caps on coach compensation by age group and skill level
            </p>
          </div>
          <Badge variant={enabled ? 'default' : 'secondary'}>
            {enabled ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Main Content */}
      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">Policy Settings</TabsTrigger>
          <TabsTrigger value="limits">Cap Limits Matrix</TabsTrigger>
          <TabsTrigger value="exceptions">
            Exception Requests
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Policy Configuration</CardTitle>
              <CardDescription>
                Configure how coach compensation limits are enforced across your association
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enabled" className="text-base">
                    Enable Policy
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    When enabled, coach compensation limits will be enforced for all teams
                  </div>
                </div>
                <Switch
                  id="enabled"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                />
              </div>

              <Separator />

              {/* Enforcement Mode */}
              <div className="space-y-3">
                <Label>Enforcement Mode</Label>
                <EnforcementModeSelector
                  value={enforcementMode}
                  onChange={setEnforcementMode}
                  disabled={!enabled}
                />
              </div>

              <Separator />

              {/* Category Scope */}
              <div className="space-y-3">
                <Label>Coach Compensation Categories</Label>
                <div className="text-sm text-muted-foreground mb-2">
                  Select which expense categories count toward coach compensation caps
                </div>
                <CategoryScopeSelector
                  categories={categories}
                  selectedIds={categoryIds}
                  onChange={setCategoryIds}
                  disabled={!enabled}
                />
              </div>

              <Separator />

              {/* Approaching Threshold */}
              <div className="space-y-3">
                <Label htmlFor="threshold">Alert Threshold</Label>
                <div className="text-sm text-muted-foreground mb-2">
                  Generate alerts when teams reach this percentage of their cap
                </div>
                <div className="flex items-center gap-4">
                  <input
                    id="threshold"
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.05"
                    value={approachingThreshold}
                    onChange={(e) => setApproachingThreshold(parseFloat(e.target.value))}
                    disabled={!enabled}
                    className="flex-1"
                  />
                  <div className="text-sm font-medium min-w-[60px] text-right">
                    {(approachingThreshold * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {enabled && categoryIds.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please select at least one category to track coach compensation. Without categories selected,
                    the policy will not enforce any limits.
                  </AlertDescription>
                </Alert>
              )}

              {/* Save Button */}
              <div className="pt-4">
                <Button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Limits Matrix Tab */}
        <TabsContent value="limits">
          <Card>
            <CardHeader>
              <CardTitle>Coach Compensation Cap Matrix</CardTitle>
              <CardDescription>
                Set maximum coach compensation amounts by age group and skill level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CapMatrixEditor
                associationId={associationId}
                policyId={policyId}
                initialLimits={limits}
                onSaved={loadData}
                disabled={!enabled}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exceptions Tab */}
        <TabsContent value="exceptions">
          <Card>
            <CardHeader>
              <CardTitle>Exception Requests</CardTitle>
              <CardDescription>
                Review and approve requests from teams to exceed their coach compensation caps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExceptionRequestsTable
                associationId={associationId}
                exceptions={exceptions}
                onUpdated={loadData}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
