'use client'

import { AppNav } from '@/components/app-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Plus } from 'lucide-react'

export default function BudgetPage() {
  // TODO: Fetch real data from database
  const budgetData = [
    {
      id: '1',
      category: 'Ice Time',
      allocated: 4000,
      spent: 1200,
      color: '#7CB342', // meadow
    },
    {
      id: '2',
      category: 'Equipment',
      allocated: 2500,
      spent: 800,
      color: '#FFC414', // golden
    },
    {
      id: '3',
      category: 'Tournaments',
      allocated: 2000,
      spent: 0,
      color: '#001B40', // navy
    },
    {
      id: '4',
      category: 'Team Events',
      allocated: 1000,
      spent: 250,
      color: '#002D79', // navy-medium
    },
    {
      id: '5',
      category: 'Miscellaneous',
      allocated: 500,
      spent: 150,
      color: '#64748b', // gray
    },
  ]

  const totalBudget = budgetData.reduce((sum, item) => sum + item.allocated, 0)
  const totalSpent = budgetData.reduce((sum, item) => sum + item.spent, 0)
  const totalRemaining = totalBudget - totalSpent

  const pieData = budgetData.map((item) => ({
    name: item.category,
    value: item.allocated,
    spent: item.spent,
    color: item.color,
  }))

  const barData = budgetData.map((item) => ({
    name: item.category,
    Allocated: item.allocated,
    Spent: item.spent,
    Remaining: item.allocated - item.spent,
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
              <CardDescription className="text-navy/60">Total Budget</CardDescription>
              <CardTitle className="text-3xl text-navy">${totalBudget.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-navy/70">Allocated across {budgetData.length} categories</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardDescription className="text-navy/60">Total Spent</CardDescription>
              <CardTitle className="text-3xl text-navy">${totalSpent.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Progress value={(totalSpent / totalBudget) * 100} className="flex-1" />
                <span className="text-sm font-medium text-navy/70">
                  {((totalSpent / totalBudget) * 100).toFixed(0)}%
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
                <span className="text-navy/70">{((totalRemaining / totalBudget) * 100).toFixed(0)}% available</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pie Chart */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-navy">Budget Allocation</CardTitle>
              <CardDescription>How your budget is distributed</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-navy">Spending Overview</CardTitle>
              <CardDescription>Allocated vs. Spent by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Allocated" fill="#001B40" name="Allocated" />
                  <Bar dataKey="Spent" fill="#7CB342" name="Spent" />
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
              {budgetData.map((item) => {
                const percentage = (item.spent / item.allocated) * 100
                const remaining = item.allocated - item.spent

                return (
                  <div key={item.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <h3 className="font-semibold text-navy">{item.category}</h3>
                          <p className="text-sm text-navy/60 mt-0.5">
                            ${item.spent.toLocaleString()} of ${item.allocated.toLocaleString()} spent
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusIcon(item.allocated, item.spent)}
                        <Badge
                          variant="outline"
                          className={`${
                            percentage >= 90
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : percentage >= 70
                              ? 'bg-golden/10 text-golden border-golden/30'
                              : 'bg-meadow/10 text-meadow border-meadow/30'
                          }`}
                        >
                          {percentage.toFixed(0)}% Used
                        </Badge>
                      </div>
                    </div>

                    <div className="mb-2">
                      <Progress value={percentage} className="h-3" />
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className={`font-medium ${getStatusColor(item.allocated, item.spent)}`}>
                        ${remaining.toLocaleString()} remaining
                      </span>
                      <span className="text-navy/60">
                        {percentage >= 90 && '⚠️ Nearly depleted'}
                        {percentage >= 70 && percentage < 90 && '⚡ Watch spending'}
                        {percentage < 70 && '✓ On track'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
