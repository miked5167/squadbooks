'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { TrendingUp, AlertTriangle, Plus, Loader2, CheckCircle, AlertCircle, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { BudgetHealthSummary } from '@/components/dashboard/BudgetHealthSummary'
import { BudgetAllocationChart } from '@/components/dashboard/BudgetAllocationChart'
import { CategoryGroup } from '@/components/budget/CategoryGroup'
import { BudgetFilters, type FilterStatus } from '@/components/budget/BudgetFilters'
import { CashPositionCards } from '@/components/budget/CashPositionCards'
import { BudgetPositionCards } from '@/components/budget/BudgetPositionCards'
import { RequestApprovalDialog } from '@/components/budget/RequestApprovalDialog'
import type { BudgetSummary, BudgetHeadingGroup } from '@/lib/types/budget'
import { groupCategoriesByHeading, getBudgetStatus, type CategoryWithHeading } from '@/lib/utils/budgetStatus'

type BudgetViewMode = 'budget' | 'cash'

interface BudgetData {
  teamId: string
  season: string
  totalBudget: number
  totalAllocated: number
  totalSpent: number
  totalPending: number
  totalRemaining: number
  overallPercentage: number
  projectedPercentage: number
  overallHealth: string
  projectedHealth: string
  categories: Array<{
    categoryId: string
    categoryName: string
    categoryHeading: string
    categoryColor: string
    allocated: number
    spent: number
    pending: number
    remaining: number
    percentage: number
    projectedPercentage: number
    health: string
    projectedHealth: string
  }>
  unallocated: number
}

interface BudgetPageClientProps {
  isTreasurer: boolean
}

export function BudgetPageClient({ isTreasurer }: BudgetPageClientProps) {
  const router = useRouter()
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<{
    id: string
    name: string
    allocated: number
  } | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [saving, setSaving] = useState(false)

  // Add Category dialog state
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryHeading, setNewCategoryHeading] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6')
  const [newCategoryType, setNewCategoryType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
  const [addingSaving, setAddingSaving] = useState(false)

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [showSpendingOnly, setShowSpendingOnly] = useState(false)

  // View mode state - Budget View is default
  const [budgetViewMode, setBudgetViewMode] = useState<BudgetViewMode>('budget')

  // Financial summary state
  const [financialSummary, setFinancialSummary] = useState<{
    totalIncome: number
    totalExpenses: number
    netPosition: number
    budgetedExpensesTotal: number
  } | null>(null)

  // Scroll to category function
  const scrollToCategory = (heading: string) => {
    const element = document.getElementById(`category-group-${heading}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Flash the element briefly to indicate it
      element.classList.add('ring-2', 'ring-navy', 'ring-offset-2')
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-navy', 'ring-offset-2')
      }, 2000)
    }
  }

  async function fetchBudget() {
    try {
      const res = await fetch('/api/budget')
      if (res.ok) {
        const data = await res.json()
        setBudgetData(data)
      } else {
        toast.error('Failed to load budget data')
      }
    } catch (err) {
      console.error('Failed to fetch budget:', err)
      toast.error('Failed to load budget data')
    } finally {
      setLoading(false)
    }
  }

  async function fetchFinancialSummary() {
    try {
      const res = await fetch('/api/financial-summary')
      if (res.ok) {
        const data = await res.json()
        setFinancialSummary(data)
      }
    } catch (err) {
      console.error('Failed to fetch financial summary:', err)
    }
  }

  useEffect(() => {
    fetchBudget()
    fetchFinancialSummary()
  }, [])

  // Transform categories to CategoryWithHeading format
  const categoriesWithHeading: CategoryWithHeading[] = useMemo(() => {
    if (!budgetData) return []
    return budgetData.categories.map(cat => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      categoryHeading: cat.categoryHeading,
      categoryColor: cat.categoryColor,
      allocated: cat.allocated,
      spent: cat.spent,
      pending: cat.pending,
      remaining: cat.remaining,
      percentage: cat.percentage,
      projectedPercentage: cat.projectedPercentage,
    }))
  }, [budgetData])

  // Group categories by heading
  const groupedCategories = useMemo(
    () => groupCategoriesByHeading(categoriesWithHeading),
    [categoriesWithHeading]
  )

  // Apply search and filter
  const filteredGroups = useMemo(() => {
    let filtered = groupedCategories

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered
        .map(group => ({
          ...group,
          categories: group.categories.filter(cat => {
            const status = getBudgetStatus(cat.allocated, cat.spent)
            return status === filterStatus
          }),
        }))
        .filter(group => group.categories.length > 0)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered
        .map(group => ({
          ...group,
          categories: group.categories.filter(cat =>
            cat.categoryName.toLowerCase().includes(query) ||
            cat.categoryHeading.toLowerCase().includes(query)
          ),
        }))
        .filter(group => group.categories.length > 0)
    }

    // Apply show spending only filter
    if (showSpendingOnly) {
      filtered = filtered
        .map(group => ({
          ...group,
          categories: group.categories.filter(cat => cat.spent > 0),
        }))
        .filter(group => group.categories.length > 0)
    }

    return filtered
  }, [groupedCategories, filterStatus, searchQuery, showSpendingOnly])

  // Calculate counts for filters
  const totalCategoryCount = categoriesWithHeading.length
  const filteredCategoryCount = filteredGroups.reduce((sum, group) => sum + group.categories.length, 0)

  // Get unique headings from existing categories with their colors
  const uniqueHeadings = useMemo(() => {
    if (!budgetData) return []
    const headings = new Set(budgetData.categories.map(cat => cat.categoryHeading))
    return Array.from(headings).sort()
  }, [budgetData])

  // Create a map of heading to color based on existing categories
  const headingColorMap = useMemo(() => {
    if (!budgetData) return new Map<string, string>()
    const map = new Map<string, string>()
    budgetData.categories.forEach(cat => {
      if (!map.has(cat.categoryHeading)) {
        map.set(cat.categoryHeading, cat.categoryColor)
      }
    })
    return map
  }, [budgetData])

  // Update color when heading changes
  useEffect(() => {
    if (newCategoryHeading && headingColorMap.has(newCategoryHeading)) {
      const headingColor = headingColorMap.get(newCategoryHeading)
      if (headingColor) {
        setNewCategoryColor(headingColor)
      }
    }
  }, [newCategoryHeading, headingColorMap])

  const handleEditBudget = (category: { id: string; name: string; allocated: number }) => {
    setEditingCategory(category)
    setEditAmount(category.allocated.toString())
    setEditDialogOpen(true)
  }

  const handleAddCategory = async () => {
    // Validate inputs
    if (!newCategoryName.trim()) {
      toast.error('Category name is required')
      return
    }
    if (!newCategoryHeading) {
      toast.error('Please select a heading')
      return
    }

    setAddingSaving(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          heading: newCategoryHeading,
          color: newCategoryColor,
          type: newCategoryType,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Category created successfully')
        setAddCategoryDialogOpen(false)
        // Reset form
        setNewCategoryName('')
        setNewCategoryHeading('')
        setNewCategoryColor('#3B82F6')
        setNewCategoryType('EXPENSE')
        // Refresh budget data
        await fetchBudget()
      } else {
        toast.error(data.error || 'Failed to create category')
      }
    } catch (err) {
      console.error('Failed to create category:', err)
      toast.error('Failed to create category')
    } finally {
      setAddingSaving(false)
    }
  }

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/transactions?categoryId=${categoryId}`)
  }

  const handleSaveBudget = async () => {
    if (!editingCategory) return

    const amount = parseFloat(editAmount)
    if (isNaN(amount) || amount < 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/budget/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          allocated: amount,
        }),
      })

      if (res.ok) {
        toast.success('Budget updated successfully')
        setEditDialogOpen(false)
        setEditingCategory(null)
        setEditAmount('')
        // Refresh budget data
        await fetchBudget()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update budget')
      }
    } catch (err) {
      console.error('Failed to update budget:', err)
      toast.error('Failed to update budget')
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

  if (!budgetData) {
    return (
      <Card className="border-0 shadow-card">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-navy" />
            </div>
            <h3 className="text-lg font-semibold text-navy mb-2">No Budget Data</h3>
            <p className="text-navy/60 mb-4">
              Set up your budget to start tracking spending
            </p>
            {isTreasurer && (
              <Button className="bg-navy hover:bg-navy-medium text-white">
                <Plus className="mr-2 w-4 h-4" />
                Create Budget
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const { totalAllocated, totalSpent, totalRemaining, totalPending, categories, season } = budgetData

  // Create BudgetSummary for health summary component
  const categoriesOnTrack = categories.filter((cat) => cat.percentage <= 70).length
  const categoriesWarning = categories.filter((cat) => cat.percentage > 70 && cat.percentage < 90).length
  const categoriesOverBudget = categories.filter((cat) => cat.percentage >= 90).length

  const budgetSummary: BudgetSummary = {
    totalBudget: totalAllocated * 100, // Convert to cents
    totalSpent: totalSpent * 100,
    totalRemaining: totalRemaining * 100,
    percentUsed: totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0,
    categoriesOnTrack,
    categoriesWarning,
    categoriesOverBudget,
    projectedSurplusDeficit: (totalRemaining - (totalPending || 0)) * 100,
    season: season || '2024-25 Season',
    lastUpdated: new Date(),
  }

  // Group categories by heading for allocation chart
  const headingGroups = categories.reduce((acc, item) => {
    const heading = item.categoryHeading
    if (!acc[heading]) {
      acc[heading] = {
        heading,
        color: item.categoryColor,
        allocated: 0,
        spent: 0,
        percentOfTotal: 0,
      }
    }
    acc[heading].allocated += item.allocated * 100 // Convert to cents
    acc[heading].spent += item.spent * 100
    return acc
  }, {} as Record<string, BudgetHeadingGroup>)

  // Calculate percentages
  const allocationGroups = Object.values(headingGroups).map((group) => ({
    ...group,
    percentOfTotal: totalAllocated > 0 ? (group.allocated / 100 / totalAllocated) * 100 : 0,
  }))

  return (
    <>
      {/* Page Header with View Toggle */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-display-2 text-navy mb-2">Budget</h1>
            <p className="text-base sm:text-lg text-navy/70">{season || '2024-25 Season'}</p>
          </div>
          {isTreasurer && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href="/budget/approvals">
                <Button variant="outline" className="w-full sm:w-auto">
                  <ClipboardList className="mr-2 w-4 h-4" />
                  View Approvals
                </Button>
              </Link>
              <RequestApprovalDialog
                teamId={budgetData?.teamId || ''}
                budgetTotal={budgetData?.totalAllocated || 0}
              />
              <Button
                className="bg-navy hover:bg-navy-medium text-white"
                onClick={() => setAddCategoryDialogOpen(true)}
              >
                <Plus className="mr-2 w-4 h-4" />
                Add Category
              </Button>
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-3">
          <ToggleGroup
            type="single"
            value={budgetViewMode}
            onValueChange={(value) => {
              if (value) setBudgetViewMode(value as BudgetViewMode)
            }}
            className="inline-flex bg-cream rounded-lg p-1 border border-navy/10"
            role="tablist"
            aria-label="Budget view mode"
          >
            <ToggleGroupItem
              value="budget"
              className="px-6 py-2 rounded-md text-sm font-semibold transition-all data-[state=on]:bg-navy data-[state=on]:text-white data-[state=off]:text-navy/70 data-[state=off]:hover:text-navy"
              role="tab"
              aria-selected={budgetViewMode === 'budget'}
              aria-controls="budget-view-content"
            >
              Budget View
            </ToggleGroupItem>
            <ToggleGroupItem
              value="cash"
              className="px-6 py-2 rounded-md text-sm font-semibold transition-all data-[state=on]:bg-navy data-[state=on]:text-white data-[state=off]:text-navy/70 data-[state=off]:hover:text-navy"
              role="tab"
              aria-selected={budgetViewMode === 'cash'}
              aria-controls="cash-view-content"
            >
              Cash View
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* BUDGET VIEW - Shows Budget Position */}
      {budgetViewMode === 'budget' && (
        <div id="budget-view-content" role="tabpanel" aria-labelledby="budget-view-tab">
          {/* BUDGET POSITION */}
          <div className="mb-6">
            <h2 className="text-base font-semibold text-navy/70 mb-1 uppercase tracking-wide">Budget Position</h2>
            <p className="text-sm text-navy/60 mb-3">
              Planned season budget and how your team is tracking against it.
            </p>
            <BudgetPositionCards
              totalBudgeted={totalAllocated}
              totalSpent={totalSpent}
              totalRemaining={totalRemaining}
            />
          </div>

          {/* Budget Health Summary */}
          <div className="mb-8">
            <BudgetHealthSummary
              summary={budgetSummary}
              onStatusClick={(status) => {
                setFilterStatus(status)
                // Scroll to category breakdown section
                const categorySection = document.querySelector('[data-category-breakdown]')
                if (categorySection) {
                  categorySection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }}
            />
          </div>
        </div>
      )}

      {/* CASH VIEW - Shows Cash Position */}
      {budgetViewMode === 'cash' && financialSummary && (
        <div id="cash-view-content" role="tabpanel" aria-labelledby="cash-view-tab">
          {/* CASH POSITION */}
          <div className="mb-8">
            <h2 className="text-base font-semibold text-navy/70 mb-1 uppercase tracking-wide">Cash Position</h2>
            <p className="text-sm text-navy/60 mb-3">
              Actual money received and spent so far this season.
            </p>
            <CashPositionCards
              totalIncome={financialSummary.totalIncome}
              totalExpenses={financialSummary.totalExpenses}
              netPosition={financialSummary.netPosition}
            />
          </div>
        </div>
      )}

      {/* Budget Allocation Chart */}
      <div className="mb-8">
        <BudgetAllocationChart
          groups={allocationGroups}
          totalBudget={totalAllocated * 100}
          onSegmentClick={scrollToCategory}
        />
      </div>

      {/* Category Breakdown with Search & Filters */}
      <Card className="border-0 shadow-card" data-category-breakdown>
        <CardHeader>
          <CardTitle className="text-navy">Category Breakdown</CardTitle>
          <CardDescription>
            {totalCategoryCount} categories grouped by heading
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="mb-6">
            <BudgetFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
              resultCount={filteredCategoryCount}
              totalCount={totalCategoryCount}
              showSpendingOnly={showSpendingOnly}
              onShowSpendingOnlyChange={setShowSpendingOnly}
            />
          </div>

          {/* Grouped Categories */}
          {filteredGroups.length > 0 ? (
            <div className="space-y-4">
              {filteredGroups.map((group) => (
                <div key={`${group.heading}-${filterStatus}-${searchQuery}`} id={`category-group-${group.heading}`}>
                  <CategoryGroup
                    group={group}
                    onEdit={isTreasurer ? handleEditBudget : undefined}
                    onCategoryClick={handleCategoryClick}
                    defaultExpanded={filterStatus !== 'all' || searchQuery !== '' || showSpendingOnly}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-navy/40" />
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2">No categories found</h3>
              <p className="text-navy/60 mb-6 max-w-sm mx-auto">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No budget categories have been created yet'}
              </p>
              {(searchQuery || filterStatus !== 'all' || showSpendingOnly) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setFilterStatus('all')
                    setShowSpendingOnly(false)
                  }}
                  className="border-navy/20 text-navy hover:bg-navy/5"
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Budget Dialog */}
      {isTreasurer && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Budget Allocation</DialogTitle>
              <DialogDescription>
                Update the budget allocation for {editingCategory?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Allocated Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/60">$</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveBudget}
                disabled={saving}
                className="bg-navy hover:bg-navy-medium text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Category Dialog */}
      {isTreasurer && (
        <Dialog open={addCategoryDialogOpen} onOpenChange={setAddCategoryDialogOpen}>
          <DialogContent className="bg-white dark:bg-gray-900">
            <DialogHeader>
              <DialogTitle className="text-navy dark:text-white text-xl font-bold">Add New Category</DialogTitle>
              <DialogDescription className="text-gray-700 dark:text-gray-300">
                Create a custom category for your team's budget
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName" className="text-navy dark:text-white font-medium">Category Name</Label>
                <Input
                  id="categoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Team Gear"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryType" className="text-navy dark:text-white font-medium">Type</Label>
                <Select value={newCategoryType} onValueChange={(value: 'EXPENSE' | 'INCOME') => setNewCategoryType(value)}>
                  <SelectTrigger id="categoryType" className="bg-white text-navy">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectItem value="EXPENSE" className="text-navy dark:text-white hover:bg-navy/10 focus:bg-navy/10 cursor-pointer">
                      Expense
                    </SelectItem>
                    <SelectItem value="INCOME" className="text-navy dark:text-white hover:bg-navy/10 focus:bg-navy/10 cursor-pointer">
                      Income
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryHeading" className="text-navy dark:text-white font-medium">Heading</Label>
                <Select value={newCategoryHeading} onValueChange={setNewCategoryHeading}>
                  <SelectTrigger id="categoryHeading" className="bg-white text-navy">
                    <SelectValue placeholder="Select a heading" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    {uniqueHeadings.map((heading) => (
                      <SelectItem
                        key={heading}
                        value={heading}
                        className="text-navy dark:text-white hover:bg-navy/10 focus:bg-navy/10 cursor-pointer"
                      >
                        {heading}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryColor" className="text-navy dark:text-white font-medium">Color</Label>
                <Input
                  id="categoryColor"
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-24 h-12 cursor-pointer"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAddCategoryDialogOpen(false)
                  setNewCategoryName('')
                  setNewCategoryHeading('')
                  setNewCategoryColor('#3B82F6')
                  setNewCategoryType('EXPENSE')
                }}
                disabled={addingSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCategory}
                disabled={addingSaving}
                className="bg-navy hover:bg-navy-medium text-white"
              >
                {addingSaving ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 w-4 h-4" />
                    Add Category
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
