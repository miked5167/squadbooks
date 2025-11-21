'use client'

import { useState, useEffect } from 'react'
import { AppNav } from '@/components/app-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Plus, Loader2, Edit, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface BudgetData {
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

export default function BudgetPage() {
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

  useEffect(() => {
    fetchBudget()
  }, [])

  const handleEditBudget = (category: { id: string; name: string; allocated: number }) => {
    setEditingCategory(category)
    setEditAmount(category.allocated.toString())
    setEditDialogOpen(true)
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
      <div className="min-h-screen bg-cream">
        <AppNav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-navy" />
          </div>
        </main>
      </div>
    )
  }

  if (!budgetData) {
    return (
      <div className="min-h-screen bg-cream">
        <AppNav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <Button className="bg-navy hover:bg-navy-medium text-white">
                  <Plus className="mr-2 w-4 h-4" />
                  Create Budget
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const { totalAllocated, totalSpent, totalRemaining, categories } = budgetData

  // Group categories by heading for pie chart
  const headingGroups = categories.reduce((acc, item) => {
    const heading = item.categoryHeading
    if (!acc[heading]) {
      acc[heading] = {
        name: heading,
        value: 0,
        spent: 0,
        // Use first category color from this heading
        color: item.categoryColor,
      }
    }
    acc[heading].value += item.allocated
    acc[heading].spent += item.spent
    return acc
  }, {} as Record<string, { name: string; value: number; spent: number; color: string }>)

  const pieData = Object.values(headingGroups)

  // Show top 8 categories by allocation for bar chart (reduced for label clarity)
  const barData = [...categories]
    .filter((cat) => cat.allocated > 0)
    .sort((a, b) => b.allocated - a.allocated)
    .slice(0, 8)
    .map((item) => ({
      name: item.categoryName,
      Allocated: item.allocated,
      Spent: item.spent,
    }))

  const getStatusIcon = (allocated: number, spent: number) => {
    const percentage = (spent / allocated) * 100
    if (percentage >= 90) {
      return <AlertTriangle className="w-5 h-5 text-red-500" />
    } else if (percentage >= 70) {
      return <TrendingUp className="w-5 h-5 text-golden" />
    } else {
      return <CheckCircle className="w-5 h-5 text-meadow" />
    }
  }

  const getStatusColor = (allocated: number, spent: number) => {
    const percentage = (spent / allocated) * 100
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 70) return 'text-golden'
    return 'text-meadow'
  }

  return (
    <div className="min-h-screen bg-cream">
      <AppNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-display-2 text-navy mb-2">Budget</h1>
            <p className="text-lg text-navy/70">Track spending across all budget categories</p>
          </div>
          <Button className="bg-navy hover:bg-navy-medium text-white">
            <Plus className="mr-2 w-4 h-4" />
            Add Category
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardDescription className="text-navy/60">Total Allocated</CardDescription>
              <CardTitle className="text-3xl text-navy">${totalAllocated.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-navy/70">Allocated across {categories.length} categories</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardDescription className="text-navy/60">Total Spent</CardDescription>
              <CardTitle className="text-3xl text-navy">${totalSpent.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Progress value={(totalSpent / totalAllocated) * 100} className="flex-1" />
                <span className="text-sm font-medium text-navy/70">
                  {totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardDescription className="text-navy/60">Remaining</CardDescription>
              <CardTitle className="text-3xl text-meadow">${totalRemaining.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="w-4 h-4 text-meadow" />
                <span className="text-navy/70">{totalAllocated > 0 ? ((totalRemaining / totalAllocated) * 100).toFixed(0) : 0}% available</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pie Chart */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-navy">Budget Allocation by Category</CardTitle>
              <CardDescription>Grouped by major spending areas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-navy">Top 10 Budget Categories</CardTitle>
              <CardDescription>Highest budget allocations and spending</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={barData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
                >
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Bar dataKey="Allocated" fill="#001B40" name="Allocated" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Spent" fill="#7CB342" name="Spent" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-navy">Category Breakdown</CardTitle>
            <CardDescription>Detailed view of all budget categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {categories.map((item) => {
                return (
                  <div key={item.categoryId} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.categoryColor }}
                        />
                        <div>
                          <h3 className="font-semibold text-navy">{item.categoryName}</h3>
                          <p className="text-sm text-navy/60 mt-0.5">
                            ${item.spent.toLocaleString()} of ${item.allocated.toLocaleString()} spent
                          </p>
                          {item.pending > 0 && (
                            <div className="flex items-center gap-1 text-sm text-golden mt-1">
                              <Clock className="w-3 h-3" />
                              <span>${item.pending.toLocaleString()} pending</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusIcon(item.allocated, item.spent)}
                        <Badge
                          variant="outline"
                          className={`${
                            item.percentage >= 90
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : item.percentage >= 70
                              ? 'bg-golden/10 text-golden border-golden/30'
                              : 'bg-meadow/10 text-meadow border-meadow/30'
                          }`}
                        >
                          {item.percentage.toFixed(0)}% Used
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditBudget({
                            id: item.categoryId,
                            name: item.categoryName,
                            allocated: item.allocated
                          })}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mb-2">
                      <Progress value={item.percentage} className="h-3" />
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className={`font-medium ${getStatusColor(item.allocated, item.spent)}`}>
                        ${item.remaining.toLocaleString()} remaining
                      </span>
                      <span className="text-navy/60">
                        {item.percentage >= 90 && '⚠️ Nearly depleted'}
                        {item.percentage >= 70 && item.percentage < 90 && '⚡ Watch spending'}
                        {item.percentage < 70 && '✓ On track'}
                      </span>
                    </div>
                    {item.pending > 0 && item.projectedPercentage !== item.percentage && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-navy/60">Projected (with pending):</span>
                          <Badge
                            variant="outline"
                            className={`${
                              item.projectedPercentage >= 90
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : item.projectedPercentage >= 70
                                ? 'bg-golden/10 text-golden border-golden/30'
                                : 'bg-meadow/10 text-meadow border-meadow/30'
                            }`}
                          >
                            {item.projectedPercentage.toFixed(0)}% Projected
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Edit Budget Dialog */}
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
    </div>
  )
}
