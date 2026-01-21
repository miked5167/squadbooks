/**
 * Budget & Categories Settings Page
 * Manage budget categories, headings, and colors
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Edit, Archive, TrendingDown, TrendingUp } from 'lucide-react'

interface Category {
  id: string
  name: string
  heading: string
  color: string
  sortOrder: number
  isActive: boolean
  createdAt: string
}

interface BudgetAllocation {
  categoryId: string
  allocated: number
}

// Define expense and income group headings
const EXPENSE_GROUPS = [
  'Ice & Facilities',
  'Equipment & Uniforms',
  'Tournament & League Fees',
  'Travel & Accommodation',
  'Coaching & Officials',
  'Fundraising & Events',
  'Administrative',
  'Other',
] as const

const INCOME_GROUPS = ['Fundraising & Income'] as const

const STORAGE_KEY = 'categories-expanded-groups'

export default function CategoriesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [budgetAllocations, setBudgetAllocations] = useState<BudgetAllocation[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    heading: '',
    color: '#3B82F6',
    sortOrder: 0,
  })

  // Helper to get all unique group headings from categories
  function getAllGroupHeadings(): string[] {
    const headings = new Set(categories.map((c) => c.heading))
    return Array.from(headings)
  }

  // Load expanded groups from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          setExpandedGroups(JSON.parse(saved))
        } catch {
          // If parsing fails, default to all expanded
          setExpandedGroups(getAllGroupHeadings())
        }
      } else {
        // Default: all groups expanded
        setExpandedGroups(getAllGroupHeadings())
      }
      setIsInitialized(true)
    }
  }, [isInitialized, categories])

  // Save expanded groups to localStorage
  useEffect(() => {
    if (isInitialized && expandedGroups.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expandedGroups))
    }
  }, [expandedGroups, isInitialized])

  // Fetch categories and budget data
  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      // Fetch categories and budget in parallel
      const [categoriesRes, budgetRes] = await Promise.all([
        fetch('/api/settings/categories'),
        fetch('/api/budget').catch(() => null), // Budget is optional
      ])

      if (!categoriesRes.ok) {
        throw new Error('Failed to fetch categories')
      }

      const categoriesData = await categoriesRes.json()
      setCategories(categoriesData.categories)

      // Load budget allocations if available
      if (budgetRes?.ok) {
        const budgetData = await budgetRes.json()
        if (budgetData.categories) {
          const allocations: BudgetAllocation[] = budgetData.categories.map(
            (cat: any) => ({
              categoryId: cat.categoryId,
              allocated: cat.allocated || 0,
            })
          )
          setBudgetAllocations(allocations)
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load categories',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchCategories() {
    await fetchData()
  }

  // Handle create category
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/settings/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create category')
      }

      toast({
        title: 'Success',
        description: 'Category created successfully',
      })

      setCreateDialogOpen(false)
      resetForm()
      fetchCategories()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create category',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle update category
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCategory) return

    setSubmitting(true)

    try {
      const res = await fetch('/api/settings/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCategory.id,
          ...formData,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update category')
      }

      toast({
        title: 'Success',
        description: 'Category updated successfully',
      })

      setEditDialogOpen(false)
      setSelectedCategory(null)
      resetForm()
      fetchCategories()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update category',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle archive/unarchive category
  async function handleArchive() {
    if (!selectedCategory) return

    setSubmitting(true)

    try {
      if (selectedCategory.isActive) {
        // Archive (soft delete)
        const res = await fetch('/api/settings/categories', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedCategory.id }),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Failed to archive category')
        }

        toast({
          title: 'Success',
          description: 'Category archived successfully',
        })
      } else {
        // Unarchive
        const res = await fetch('/api/settings/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedCategory.id,
            isActive: true,
          }),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Failed to unarchive category')
        }

        toast({
          title: 'Success',
          description: 'Category unarchived successfully',
        })
      }

      setArchiveDialogOpen(false)
      setSelectedCategory(null)
      fetchCategories()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update category',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      heading: '',
      color: '#3B82F6',
      sortOrder: 0,
    })
  }

  function openEditDialog(category: Category) {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      heading: category.heading,
      color: category.color,
      sortOrder: category.sortOrder,
    })
    setEditDialogOpen(true)
  }

  function openCreateDialogForGroup(heading: string) {
    setFormData({
      name: '',
      heading: heading,
      color: '#3B82F6',
      sortOrder: 0,
    })
    setCreateDialogOpen(true)
  }

  // Helper functions for group classification
  function isIncomeGroup(heading: string): boolean {
    return INCOME_GROUPS.includes(heading as any)
  }

  function isExpenseGroup(heading: string): boolean {
    return EXPENSE_GROUPS.includes(heading as any)
  }

  // Calculate total budget allocation for a group
  function getGroupTotal(heading: string): number {
    const groupCategories = categories.filter((c) => c.heading === heading)
    const total = groupCategories.reduce((sum, cat) => {
      const allocation = budgetAllocations.find((a) => a.categoryId === cat.id)
      return sum + (allocation?.allocated || 0)
    }, 0)
    return total
  }

  // Group categories by heading
  const groupedCategories = categories.reduce((acc, category) => {
    if (!acc[category.heading]) {
      acc[category.heading] = []
    }
    acc[category.heading].push(category)
    return acc
  }, {} as Record<string, Category[]>)

  // Separate groups into expense and income
  const expenseGroupsData = Object.entries(groupedCategories).filter(([heading]) =>
    isExpenseGroup(heading)
  )
  const incomeGroupsData = Object.entries(groupedCategories).filter(([heading]) =>
    isIncomeGroup(heading)
  )
  const otherGroupsData = Object.entries(groupedCategories).filter(
    ([heading]) => !isExpenseGroup(heading) && !isIncomeGroup(heading)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    )
  }

  // Render a single category group
  const renderCategoryGroup = (
    heading: string,
    headingCategories: Category[],
    groupType: 'expense' | 'income' | 'other'
  ) => {
    const groupTotal = getGroupTotal(heading)
    const IconComponent = groupType === 'income' ? TrendingUp : TrendingDown

    return (
      <AccordionItem key={heading} value={heading} className="border-b">
        <div className="flex items-center justify-between py-3 pr-4">
          <AccordionTrigger className="hover:no-underline flex-1 py-0">
            <div className="flex items-center gap-3 w-full">
              <IconComponent
                className={`w-5 h-5 ${
                  groupType === 'income' ? 'text-green-600' : 'text-blue-600'
                }`}
              />
              <div className="text-left flex-1">
                <h3 className="font-bold text-navy">
                  {heading}
                  {groupType === 'income' && (
                    <span className="text-sm font-normal text-green-600 ml-2">
                      (Money In)
                    </span>
                  )}
                </h3>
                <span className="text-xs text-navy/60">
                  {headingCategories.length} categor
                  {headingCategories.length === 1 ? 'y' : 'ies'}
                </span>
              </div>
              {groupTotal > 0 && (
                <div className="text-right mr-2">
                  <div className="text-xs text-navy/60">Budget Total</div>
                  <div className="text-sm font-semibold text-navy">
                    ${groupTotal.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </AccordionTrigger>

          <Button
            variant="outline"
            size="sm"
            onClick={() => openCreateDialogForGroup(heading)}
            className="text-xs ml-3 flex-shrink-0"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>

        <AccordionContent className="pt-2 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {headingCategories.map((category) => (
              <div
                key={category.id}
                className={`group p-2.5 border rounded-lg transition-all ${
                  category.isActive
                    ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-6 h-6 rounded flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm text-navy truncate">
                          {category.name}
                        </h4>
                        {!category.isActive && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                            Archived
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-navy/50">
                        Sort: {category.sortOrder}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(category)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(category)
                        setArchiveDialogOpen(true)
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-navy">Budget & Categories</h2>
              <p className="text-sm text-navy/60 mt-1">
                Manage expense and income categories for budget planning
              </p>
            </div>
          </div>
        </div>

        {/* Categories List (Accordion by Group) */}
        <div className="p-6">
          {categories.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-navy/60">No categories found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Expense Categories Section */}
              {expenseGroupsData.length > 0 && (
                <div>
                  <div className="mb-3 pb-2 border-b-2 border-blue-100">
                    <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                      Expense Categories
                    </h3>
                  </div>
                  <Accordion
                    type="multiple"
                    value={expandedGroups}
                    onValueChange={setExpandedGroups}
                    className="space-y-0"
                  >
                    {expenseGroupsData.map(([heading, headingCategories]) =>
                      renderCategoryGroup(heading, headingCategories, 'expense')
                    )}
                  </Accordion>
                </div>
              )}

              {/* Income Categories Section */}
              {incomeGroupsData.length > 0 && (
                <div>
                  <div className="mb-3 pb-2 border-b-2 border-green-100">
                    <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide">
                      Income Categories
                    </h3>
                  </div>
                  <Accordion
                    type="multiple"
                    value={expandedGroups}
                    onValueChange={setExpandedGroups}
                    className="space-y-0"
                  >
                    {incomeGroupsData.map(([heading, headingCategories]) =>
                      renderCategoryGroup(heading, headingCategories, 'income')
                    )}
                  </Accordion>
                </div>
              )}

              {/* Other Categories (if any don't match expense/income) */}
              {otherGroupsData.length > 0 && (
                <div>
                  <div className="mb-3 pb-2 border-b-2 border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                      Other Categories
                    </h3>
                  </div>
                  <Accordion
                    type="multiple"
                    value={expandedGroups}
                    onValueChange={setExpandedGroups}
                    className="space-y-0"
                  >
                    {otherGroupsData.map(([heading, headingCategories]) =>
                      renderCategoryGroup(heading, headingCategories, 'other')
                    )}
                  </Accordion>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Category Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new budget category for tracking expenses
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="createName">Category Name *</Label>
                <Input
                  id="createName"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Tournament Fees"
                  required
                />
              </div>

              <div>
                <Label htmlFor="createHeading">Heading *</Label>
                <Input
                  id="createHeading"
                  value={formData.heading}
                  onChange={(e) =>
                    setFormData({ ...formData, heading: e.target.value })
                  }
                  placeholder="e.g., Team Operations"
                  required
                />
              </div>

              <div>
                <Label htmlFor="createColor">Color *</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="createColor"
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    placeholder="#3B82F6"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="createSortOrder">Sort Order *</Label>
                <Input
                  id="createSortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sortOrder: parseInt(e.target.value),
                    })
                  }
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false)
                  resetForm()
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Category'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category details
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="editName">Category Name *</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="editHeading">Heading *</Label>
                <Input
                  id="editHeading"
                  value={formData.heading}
                  onChange={(e) =>
                    setFormData({ ...formData, heading: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="editColor">Color *</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="editColor"
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="editSortOrder">Sort Order *</Label>
                <Input
                  id="editSortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sortOrder: parseInt(e.target.value),
                    })
                  }
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false)
                  setSelectedCategory(null)
                  resetForm()
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Category'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedCategory?.isActive ? 'Archive Category' : 'Unarchive Category'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCategory?.isActive ? (
                <>
                  Are you sure you want to archive <strong>{selectedCategory.name}</strong>?
                  This category will be hidden from budget planning but historical data will be
                  preserved.
                </>
              ) : (
                <>
                  Are you sure you want to unarchive{' '}
                  <strong>{selectedCategory?.name}</strong>? This category will become
                  available for budget planning again.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : selectedCategory?.isActive ? (
                'Archive'
              ) : (
                'Unarchive'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
