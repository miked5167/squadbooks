'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import type { PreSeasonBudgetData } from './BudgetWizard'

interface Category {
  id: string
  name: string
  heading: string
  color: string
  type: 'EXPENSE' | 'INCOME'
}

interface CategoryAllocatorProps {
  data: Partial<PreSeasonBudgetData>
  onChange: (data: Partial<PreSeasonBudgetData>) => void
}

export function CategoryAllocator({ data, onChange }: CategoryAllocatorProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const result = await res.json()
          // For pre-season budgets, we typically only allocate expenses
          const expenseCategories = (result.categories || []).filter(
            (cat: Category) => cat.type === 'EXPENSE'
          )
          setCategories(expenseCategories)

          // Initialize allocations if not already set
          if (!data.allocations || data.allocations.length === 0) {
            const initialAllocations = expenseCategories.map((cat: Category) => ({
              categoryId: cat.id,
              categoryName: cat.name,
              allocated: 0,
              notes: '',
            }))
            onChange({ allocations: initialAllocations })
          }
        } else {
          toast.error('Failed to load categories')
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err)
        toast.error('Failed to load categories')
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  const totalBudget = data.totalBudget || 0
  const totalAllocated = data.allocations?.reduce(
    (sum, a) => sum + a.allocated,
    0
  ) || 0
  const remaining = totalBudget - totalAllocated
  const percentageAllocated = totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0

  const isComplete = Math.abs(remaining) < 0.01
  const isOverBudget = remaining < -0.01

  const handleAllocationChange = (categoryId: string, amount: number) => {
    const updatedAllocations = data.allocations?.map((alloc) =>
      alloc.categoryId === categoryId
        ? { ...alloc, allocated: amount }
        : alloc
    ) || []

    onChange({ allocations: updatedAllocations })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount)
  }

  const distributeEvenly = () => {
    const numCategories = categories.length
    if (numCategories === 0) return

    const amountPerCategory = Number((totalBudget / numCategories).toFixed(2))
    const remainder = Number((totalBudget - (amountPerCategory * numCategories)).toFixed(2))

    const updatedAllocations = categories.map((cat, index) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      allocated: index === 0 ? amountPerCategory + remainder : amountPerCategory,
      notes: '',
    }))

    onChange({ allocations: updatedAllocations })
    toast.success('Budget distributed evenly across categories')
  }

  const clearAll = () => {
    const updatedAllocations = categories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      allocated: 0,
      notes: '',
    }))

    onChange({ allocations: updatedAllocations })
    toast.success('All allocations cleared')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-sm text-navy/60">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-navy mb-4">
          Allocate Budget by Category
        </h3>
        <p className="text-sm text-navy/70 mb-6">
          Distribute your total budget across expense categories. The total must
          equal your budget amount to proceed.
        </p>
      </div>

      {/* Summary Card */}
      <Card className={`p-6 ${isOverBudget ? 'bg-red-50 border-red-200' : 'bg-cream/50 border-gold/20'}`}>
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-navy/70">Total Budget</p>
              <p className="text-2xl font-bold text-navy">
                {formatCurrency(totalBudget)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-navy/70">Allocated</p>
              <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-navy'}`}>
                {formatCurrency(totalAllocated)}
              </p>
            </div>
          </div>

          <Progress value={percentageAllocated} className="h-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isComplete ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    Budget fully allocated
                  </span>
                </>
              ) : isOverBudget ? (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-600">
                    Over budget by {formatCurrency(Math.abs(remaining))}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-600">
                    Remaining: {formatCurrency(remaining)}
                  </span>
                </>
              )}
            </div>
            <div className="text-sm text-navy/60">
              {percentageAllocated.toFixed(1)}% allocated
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={distributeEvenly}
          className="border-navy/20"
        >
          Distribute Evenly
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearAll}
          className="border-navy/20"
        >
          Clear All
        </Button>
      </div>

      {/* Category Inputs */}
      <div className="space-y-3">
        {categories.map((category) => {
          const allocation = data.allocations?.find(
            (a) => a.categoryId === category.id
          )
          const amount = allocation?.allocated || 0
          const percentage = totalBudget > 0 ? (amount / totalBudget) * 100 : 0

          return (
            <Card key={category.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <Label htmlFor={`cat-${category.id}`} className="text-navy font-medium">
                        {category.name}
                      </Label>
                      <p className="text-xs text-navy/60">{category.heading}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-navy">
                      {formatCurrency(amount)}
                    </p>
                    <p className="text-xs text-navy/60">{percentage.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
                  <Input
                    id={`cat-${category.id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount || ''}
                    onChange={(e) =>
                      handleAllocationChange(
                        category.id,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>

                {amount > 0 && (
                  <Progress
                    value={percentage}
                    className="h-1"
                    style={{
                      // @ts-ignore
                      '--progress-background': category.color,
                    }}
                  />
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
