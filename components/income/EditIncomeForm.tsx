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
import { ArrowLeft, Upload, Loader2, TrendingUp, AlertCircle } from 'lucide-react'

interface EditIncomeFormProps {
  transactionId: string
}

export function EditIncomeForm({ transactionId }: EditIncomeFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [categories, setCategories] = useState<any[]>([])

  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
    vendor: '',
    description: '',
    transactionDate: '',
  })

  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null)

  // Fetch transaction data and categories on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch transaction data
        const transactionRes = await fetch(`/api/transactions/${transactionId}`)
        if (!transactionRes.ok) {
          const error = await transactionRes.json()
          toast.error(error.message || 'Failed to load transaction')
          router.push('/transactions')
          return
        }

        const { transaction } = await transactionRes.json()

        // Format date - simply take first 10 chars of ISO string (YYYY-MM-DD)
        const formattedDate = transaction.transactionDate
          ? transaction.transactionDate.substring(0, 10)
          : ''

        // Pre-populate form
        setFormData({
          amount: Number(transaction.amount).toFixed(2),
          categoryId: transaction.categoryId || '',
          vendor: transaction.vendor,
          description: transaction.description || '',
          transactionDate: formattedDate,
        })

        setExistingReceiptUrl(transaction.receiptUrl)

        // Fetch categories
        const categoriesRes = await fetch('/api/categories')
        if (categoriesRes.ok) {
          const data = await categoriesRes.json()
          const incomeCategories = (data.categories || []).filter(
            (cat: any) => cat.type === 'INCOME'
          )
          setCategories(incomeCategories)
        } else {
          toast.error('Failed to load categories')
        }
      } catch (err) {
        console.error('Failed to fetch transaction:', err)
        toast.error('Failed to load transaction')
        router.push('/transactions')
      } finally {
        setInitialLoading(false)
      }
    }

    fetchData()
  }, [transactionId, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setReceiptFile(null)
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB')
      e.target.value = ''
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('File must be PDF, JPG, PNG, or WebP')
      e.target.value = ''
      return
    }

    setReceiptFile(file)
    toast.success(`File selected: ${file.name}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Update transaction
      toast.loading('Updating income...')
      const transactionRes = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        throw new Error(transactionData.error || 'Failed to update transaction')
      }

      // Upload new documentation if provided
      if (receiptFile) {
        setUploadingReceipt(true)
        toast.dismiss()
        toast.loading('Uploading documentation...')

        const uploadFormData = new FormData()
        uploadFormData.append('file', receiptFile)
        uploadFormData.append('transactionId', transactionId)

        const receiptRes = await fetch('/api/receipts/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        if (!receiptRes.ok) {
          const receiptError = await receiptRes.json()
          console.error('Documentation upload failed:', receiptError.error)
          toast.dismiss()
          toast.warning('Income updated but documentation upload failed')
        } else {
          toast.dismiss()
        }
        setUploadingReceipt(false)
      } else {
        toast.dismiss()
      }

      toast.success('Income updated successfully!')

      // Redirect back to previous page (preserves filters) after a short delay
      setTimeout(() => {
        router.back()
      }, 1000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update income')
    } finally {
      setLoading(false)
      setUploadingReceipt(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-meadow" />
      </div>
    )
  }

  return (
    <>
      <Link
        href="/transactions"
        className="inline-flex items-center gap-2 text-navy hover:text-navy-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Transactions
      </Link>

      <Card className="border-0 shadow-card">
        <CardHeader className="bg-gradient-to-r from-meadow to-green-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            <CardTitle className="text-2xl">Edit Income</CardTitle>
          </div>
          <CardDescription className="text-white/90">
            Update income transaction details
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
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Income Category *</Label>
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
                    {cat.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground">
                Choose the type of income (registration fees, donations, sponsorships, etc.)
              </p>
            </div>

            {/* Source/Payer */}
            <div className="space-y-2">
              <Label htmlFor="vendor">Source/Payer *</Label>
              <Input
                type="text"
                id="vendor"
                required
                maxLength={255}
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="e.g., Parent Name, Sponsor Company, Fundraiser Event"
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
                placeholder="Additional details about this income..."
              />
              <p className="text-sm text-muted-foreground">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Documentation Upload */}
            <div className="space-y-2">
              <Label htmlFor="receipt">Documentation</Label>
              {existingReceiptUrl && !receiptFile && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-2">
                  <AlertCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-900">
                    Documentation already uploaded.{' '}
                    <a
                      href={existingReceiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      View documentation
                    </a>
                  </span>
                </div>
              )}
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
                {existingReceiptUrl && !receiptFile
                  ? 'Upload a new file to replace the existing documentation'
                  : 'Upload checks, deposit slips, or payment confirmations (PDF, JPG, PNG, WebP - Max 5MB)'}
              </p>
              {receiptFile && (
                <div className="flex items-center gap-2 text-sm text-meadow">
                  <span className="font-medium"> {receiptFile.name}</span>
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
                className="flex-1 bg-meadow hover:bg-green-600 text-white"
              >
                {loading || uploadingReceipt ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploadingReceipt ? 'Uploading...' : 'Updating...'}
                  </>
                ) : (
                  'Update Income'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
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
