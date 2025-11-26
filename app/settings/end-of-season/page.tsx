/**
 * End of Season Page
 * Close the current season and optionally create a new one (Treasurer only)
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Loader2, Calendar, AlertTriangle, CheckCircle2, Archive } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'

export default function EndOfSeasonPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Close season form state
  const [archiveData, setArchiveData] = useState(true)
  const [createNewSeason, setCreateNewSeason] = useState(false)
  const [newSeasonName, setNewSeasonName] = useState('')
  const [confirmMessage, setConfirmMessage] = useState('')

  // Reopen season form state
  const [reopenSeasonName, setReopenSeasonName] = useState('')
  const [reopenConfirmMessage, setReopenConfirmMessage] = useState('')

  // Handle close season
  async function handleCloseSeason() {
    if (confirmMessage !== 'I understand this action cannot be undone') {
      toast({
        title: 'Error',
        description: 'Please type the confirmation message exactly as shown',
        variant: 'destructive',
      })
      return
    }

    if (createNewSeason && !newSeasonName) {
      toast({
        title: 'Error',
        description: 'Please provide a name for the new season',
        variant: 'destructive',
      })
      return
    }

    setProcessing(true)

    try {
      const res = await fetch('/api/settings/season/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archiveData,
          createNewSeason,
          newSeasonName: createNewSeason ? newSeasonName : undefined,
          confirmMessage,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to close season')
      }

      const data = await res.json()

      toast({
        title: 'Success',
        description: createNewSeason
          ? `Season closed and ${data.newSeason} created`
          : 'Season closed successfully',
      })

      setCloseDialogOpen(false)
      resetCloseForm()

      // Redirect to dashboard or refresh
      router.push('/dashboard')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to close season',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  // Handle reopen season
  async function handleReopenSeason() {
    if (reopenConfirmMessage !== 'I understand this will revert to the previous season') {
      toast({
        title: 'Error',
        description: 'Please type the confirmation message exactly as shown',
        variant: 'destructive',
      })
      return
    }

    if (!reopenSeasonName) {
      toast({
        title: 'Error',
        description: 'Please provide the season name to reopen',
        variant: 'destructive',
      })
      return
    }

    setProcessing(true)

    try {
      const res = await fetch('/api/settings/season/reopen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seasonName: reopenSeasonName,
          confirmMessage: reopenConfirmMessage,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to reopen season')
      }

      toast({
        title: 'Success',
        description: `Season ${reopenSeasonName} reopened successfully`,
      })

      setReopenDialogOpen(false)
      resetReopenForm()
      router.push('/dashboard')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reopen season',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  function resetCloseForm() {
    setArchiveData(true)
    setCreateNewSeason(false)
    setNewSeasonName('')
    setConfirmMessage('')
  }

  function resetReopenForm() {
    setReopenSeasonName('')
    setReopenConfirmMessage('')
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Close Season Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Archive className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-navy">Close Current Season</h2>
            <p className="text-sm text-navy/60 mt-1">
              Archive the current season and optionally create a new one for next year
            </p>
          </div>
        </div>

        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning: Irreversible Action</AlertTitle>
          <AlertDescription className="text-sm">
            Closing a season is a permanent action. It will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Mark the current season as completed</li>
              <li>Create a snapshot of all financial data</li>
              <li>Prevent new transactions for this season</li>
              <li>Require all pending transactions to be approved first</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-navy mb-3">Pre-Close Checklist</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-navy">All transactions have been approved or rejected</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-navy">All receipts have been uploaded and verified</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-navy">Final budget report has been reviewed</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-navy">Bank reconciliation is complete</span>
              </div>
            </div>
          </div>

          <Button
            variant="destructive"
            size="lg"
            className="w-full"
            onClick={() => setCloseDialogOpen(true)}
          >
            <Archive className="w-5 h-5 mr-2" />
            Close Season
          </Button>
        </div>
      </div>

      {/* Reopen Season Card (Emergency) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-navy">Reopen Previous Season</h2>
            <p className="text-sm text-navy/60 mt-1">
              Emergency option to reopen a previously closed season
            </p>
          </div>
        </div>

        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            This is an emergency feature that should only be used if a season was closed by
            mistake. Reopening a season will revert to the previous season and may cause data
            inconsistencies.
          </AlertDescription>
        </Alert>

        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => setReopenDialogOpen(true)}
        >
          <Calendar className="w-5 h-5 mr-2" />
          Reopen Season
        </Button>
      </div>

      {/* Close Season Confirmation Dialog */}
      <AlertDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Close Current Season</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Please review the options below carefully.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              <Checkbox
                id="archiveData"
                checked={archiveData}
                onCheckedChange={(checked) => setArchiveData(checked as boolean)}
              />
              <Label htmlFor="archiveData" className="cursor-pointer">
                Create season archive (recommended)
              </Label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <Checkbox
                  id="createNewSeason"
                  checked={createNewSeason}
                  onCheckedChange={(checked) => setCreateNewSeason(checked as boolean)}
                />
                <Label htmlFor="createNewSeason" className="cursor-pointer">
                  Create new season immediately
                </Label>
              </div>

              {createNewSeason && (
                <div className="ml-9">
                  <Label htmlFor="newSeasonName" className="text-sm">
                    New Season Name *
                  </Label>
                  <Input
                    id="newSeasonName"
                    value={newSeasonName}
                    onChange={(e) => setNewSeasonName(e.target.value)}
                    placeholder="e.g., 2025-2026"
                    required={createNewSeason}
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Label htmlFor="confirmMessage" className="text-sm font-semibold text-red-600">
                Type to confirm: "I understand this action cannot be undone"
              </Label>
              <Input
                id="confirmMessage"
                value={confirmMessage}
                onChange={(e) => setConfirmMessage(e.target.value)}
                placeholder="Type the confirmation message"
                className="mt-2"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={processing}
              onClick={() => {
                setCloseDialogOpen(false)
                resetCloseForm()
              }}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleCloseSeason}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Closing Season...
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 mr-2" />
                  Close Season
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reopen Season Confirmation Dialog */}
      <AlertDialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reopen Previous Season</AlertDialogTitle>
            <AlertDialogDescription>
              This will revert to a previously closed season. Use with caution.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reopenSeasonName">Season Name to Reopen *</Label>
              <Input
                id="reopenSeasonName"
                value={reopenSeasonName}
                onChange={(e) => setReopenSeasonName(e.target.value)}
                placeholder="e.g., 2024-2025"
                required
              />
            </div>

            <div>
              <Label htmlFor="reopenConfirmMessage" className="text-sm font-semibold text-red-600">
                Type to confirm: "I understand this will revert to the previous season"
              </Label>
              <Input
                id="reopenConfirmMessage"
                value={reopenConfirmMessage}
                onChange={(e) => setReopenConfirmMessage(e.target.value)}
                placeholder="Type the confirmation message"
                className="mt-2"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={processing}
              onClick={() => {
                setReopenDialogOpen(false)
                resetReopenForm()
              }}
            >
              Cancel
            </AlertDialogCancel>
            <Button onClick={handleReopenSeason} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Reopening...
                </>
              ) : (
                'Reopen Season'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
