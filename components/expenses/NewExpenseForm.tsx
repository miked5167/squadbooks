'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ArrowLeft, Upload, Loader2, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { validateTransaction } from '@/app/transactions/actions'

export function NewExpenseForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [categories, setCategories] = useState<any[]>([])

  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
    vendor: '',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
  })

  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  // Rule validation state
  const [validationLoading, setValidationLoading] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    requiredApprovals: number
    tier: { min: number; max: number; approvals: number } | null
  } | null>(null)

  // Fetch expense categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          // Filter to only show expense categories
          const expenseCategories = (data.categories || []).filter(
            (cat: any) => cat.type === 'EXPENSE'
          )
          setCategories(expenseCategories)
        } else {
          toast.error('Failed to load categories')
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err)
        toast.error('Failed to load categories')
      }
    }
    fetchCategories()
  }, [])

  // Validate transaction when amount changes
  useEffect(() => {
    const amount = parseFloat(formData.amount)
    if (!isNaN(amount) && amount > 0) {
      const debounceTimeout = setTimeout(async () => {
        setValidationLoading(true)
        try {
          const result = await validateTransaction(amount, 'EXPENSE')
          if (result.success) {
            setValidationResult({
              requiredApprovals: result.requiredApprovals,
              tier: result.tier,
            })
          }
        } catch (error) {
          console.error('Validation error:', error)
        } finally {
          setValidationLoading(false)
        }
      }, 500) // Debounce for 500ms

      return () => clearTimeout(debounceTimeout)
    } else {
      setValidationResult(null)
    }
  }, [formData.amount])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setReceiptFile(null)
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB')
      e.target.value = '' // Reset input
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('File must be PDF, JPG, PNG, or WebP')
      e.target.value = '' // Reset input
      return
    }

    setReceiptFile(file)
    toast.success(`File selected: ${file.name}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create transaction
      toast.loading('Creating expense...')
      const transactionRes = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'EXPENSE',
          amount: parseFloat(formData.amount),
          categoryId: formData.categoryId,
          vendor: formData.vendor,
          description: formData.description || undefined,
          transactionDate: formData.transactionDate,
        }),
      })

      const transactionData = await transactionRes.json()

      if (!transactionRes.ok) {
        toast.dismiss()
        throw new Error(transactionData.error || 'Failed to create transaction')
      }

      const transactionId = transactionData.transaction.id

      // Upload receipt if provided
      if (receiptFile && transactionId) {
        setUploadingReceipt(true)
        toast.dismiss()
        toast.loading('Uploading receipt...')

        const uploadFormData = new FormData()
        uploadFormData.append('file', receiptFile)
        uploadFormData.append('transactionId', transactionId)

        const receiptRes = await fetch('/api/receipts/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        if (!receiptRes.ok) {
          const receiptError = await receiptRes.json()
          console.error('Receipt upload failed:', receiptError.error)
          toast.dismiss()
          toast.warning('Expense created but receipt upload failed')
        } else {
          toast.dismiss()
        }
        setUploadingReceipt(false)
      } else {
        toast.dismiss()
      }

      // Check for validation errors and handle accordingly
      if (transactionData.hasValidationErrors && transactionData.violations) {
        // Find receipt-related violations
        const receiptViolations = transactionData.violations.filter((v: any) =>
          v.code === 'MISSING_RECEIPT' || v.message.toLowerCase().includes('receipt')
        )

        if (receiptViolations.length > 0) {
          const violation = receiptViolations[0]
          toast.error(
            <div className="space-y-3">
              <p className="font-semibold text-base">Cannot create expense without receipt</p>
              <p className="text-sm">{violation.message}</p>
              <p className="text-xs text-muted-foreground">
                Please attach a receipt and try again, or upload one from the transactions page.
              </p>
            </div>,
            { duration: Infinity }
          )
        } else {
          // Show generic validation error
          const errorMessage = transactionData.violations
            .filter((v: any) => v.severity === 'ERROR' || v.severity === 'CRITICAL')
            .map((v: any) => v.message)
            .join('\n')

          toast.error(
            <div className="space-y-3">
              <p className="font-semibold text-base">Expense has validation issues:</p>
              <p className="whitespace-pre-line text-sm">{errorMessage}</p>
              <p className="text-xs text-muted-foreground">
                Please correct these issues from the transactions page.
              </p>
            </div>,
            { duration: Infinity }
          )
        }

        // Redirect to the created transaction after 3 seconds so user can fix it
        setTimeout(() => {
          router.push(`/transactions?highlight=${transactionId}`)
        }, 3000)
      } else {
        // Only show success and redirect if no validation errors
        toast.success('Expense created successfully!')
        setTimeout(() => {
          router.push('/transactions')
        }, 1000)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create expense')
    } finally {
      setLoading(false)
      setUploadingReceipt(false)
    }
  }

  return (
    <>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-navy hover:text-navy-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <Card className="border-0 shadow-card">
        <CardHeader className="bg-gradient-to-r from-navy to-navy-medium text-white rounded-t-lg">
          <CardTitle className="text-2xl">New Expense</CardTitle>
          <CardDescription className="text-cream/90">
            Record a new expense for your team
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/60 font-medium">$</span>
                <Input
                  type="number"
                  id="amount"
                  required
                  min="0.01"
                  step="0.01"
                  max="100000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="pl-8"
                  placeholder="0.00"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Enter the expense amount
              </p>
            </div>

            {/* Approval Requirements Display */}
            {validationLoading && formData.amount && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-900">Checking approval requirements...</span>
              </div>
            )}

            {validationResult && validationResult.requiredApprovals > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-900 mb-1">
                      Approval Required
                    </h4>
                    <p className="text-sm text-orange-800 mb-2">
                      This expense requires <strong>{validationResult.requiredApprovals} approval{validationResult.requiredApprovals > 1 ? 's' : ''}</strong>
                    </p>
                    {validationResult.tier && (
                      <p className="text-xs text-orange-700">
                        Amount range: ${validationResult.tier.min.toLocaleString()} - ${validationResult.tier.max === 999999 ? '∞' : validationResult.tier.max.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {validationResult && validationResult.requiredApprovals === 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-900">No approval required for this amount</span>
              </div>
            )}

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Expense Category *</Label>
              <select
                id="category"
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.heading})
                  </option>
                ))}
              </select>
            </div>

            {/* Vendor */}
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor/Payee *</Label>
              <Input
                type="text"
                id="vendor"
                required
                maxLength={255}
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="e.g., Hockey Equipment Store"
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Transaction Date *</Label>
              <Input
                type="date"
                id="date"
                required
                max={new Date().toISOString().split('T')[0]}
                value={formData.transactionDate}
                onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                rows={3}
                maxLength={500}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details about this expense..."
              />
              <p className="text-sm text-muted-foreground">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label htmlFor="receipt">Receipt (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  id="receipt"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                PDF, JPG, PNG, or WebP (Max 5MB)
              </p>
              {receiptFile && (
                <div className="flex items-center gap-2 text-sm text-meadow">
                  <span className="font-medium">✓ {receiptFile.name}</span>
                  <span className="text-muted-foreground">
                    ({(receiptFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading || uploadingReceipt}
                className="flex-1 bg-navy hover:bg-navy-medium text-white"
              >
                {loading || uploadingReceipt ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploadingReceipt ? 'Uploading...' : 'Creating...'}
                  </>
                ) : (
                  'Create Expense'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
                disabled={loading || uploadingReceipt}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
