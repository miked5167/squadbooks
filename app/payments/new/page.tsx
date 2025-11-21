'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewPaymentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
    vendor: '',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
  })

  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          setCategories(data.categories || [])
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      }
    }
    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Create transaction
      const transactionRes = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'INCOME',
          amount: parseFloat(formData.amount),
          categoryId: formData.categoryId,
          vendor: formData.vendor,
          description: formData.description || undefined,
          transactionDate: formData.transactionDate,
        }),
      })

      const transactionData = await transactionRes.json()

      if (!transactionRes.ok) {
        throw new Error(transactionData.error || 'Failed to create payment')
      }

      const transactionId = transactionData.transaction.id

      // Upload receipt if provided
      if (receiptFile && transactionId) {
        const formData = new FormData()
        formData.append('file', receiptFile)
        formData.append('transactionId', transactionId)

        const receiptRes = await fetch('/api/receipts/upload', {
          method: 'POST',
          body: formData,
        })

        if (!receiptRes.ok) {
          const receiptError = await receiptRes.json()
          console.error('Receipt upload failed:', receiptError.error)
          // Continue anyway - transaction was created
        }
      }

      setSuccess(transactionData.message || 'Payment created successfully!')

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/transactions')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Squadbooks</h1>
            <nav className="flex gap-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/transactions" className="text-gray-600 hover:text-gray-900">
                Transactions
              </Link>
              <Link href="/budget" className="text-gray-600 hover:text-gray-900">
                Budget
              </Link>
              <Link href="/approvals" className="text-gray-600 hover:text-gray-900">
                Approvals
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">New Payment/Income</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="amount"
                  required
                  min="0.01"
                  step="0.01"
                  max="100000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="pl-8 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Income payments are automatically approved
              </p>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.heading} - {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payer/Source */}
            <div>
              <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-2">
                Payer/Source *
              </label>
              <input
                type="text"
                id="vendor"
                required
                maxLength={255}
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Player Registration Fees, Fundraiser, Sponsor"
              />
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Date *
              </label>
              <input
                type="date"
                id="date"
                required
                max={new Date().toISOString().split('T')[0]}
                value={formData.transactionDate}
                onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                rows={3}
                maxLength={500}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional details about this payment..."
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Receipt Upload */}
            <div>
              <label htmlFor="receipt" className="block text-sm font-medium text-gray-700 mb-2">
                Receipt/Proof (Optional)
              </label>
              <input
                type="file"
                id="receipt"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                PDF, JPG, PNG, or WebP (Max 5MB)
              </p>
              {receiptFile && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ {receiptFile.name} selected ({(receiptFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
              >
                {loading ? 'Creating...' : 'Create Payment'}
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
