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
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Edit, Archive, FolderTree } from 'lucide-react'

interface Category {
  id: string
  name: string
  heading: string
  color: string
  sortOrder: number
  isActive: boolean
  createdAt: string
}

export default function CategoriesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    heading: '',
    color: '#3B82F6',
    sortOrder: 0,
  })

  // Fetch categories
  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      const res = await fetch('/api/settings/categories')
      if (!res.ok) {
        throw new Error('Failed to fetch categories')
      }
      const data = await res.json()
      setCategories(data.categories)
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

  // Group categories by heading
  const groupedCategories = categories.reduce((acc, category) => {
    if (!acc[category.heading]) {
      acc[category.heading] = []
    }
    acc[category.heading].push(category)
    return acc
  }, {} as Record<string, Category[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
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
                Manage expense categories and budget structure
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>

        {/* Categories List (Grouped by Heading) */}
        <div className="p-6 space-y-6">
          {Object.entries(groupedCategories).map(([heading, headingCategories]) => (
            <div key={heading} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <FolderTree className="w-5 h-5 text-navy" />
                <h3 className="font-bold text-navy">{heading}</h3>
                <span className="text-sm text-navy/60">
                  ({headingCategories.length} categories)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {headingCategories.map((category) => (
                  <div
                    key={category.id}
                    className={`p-4 border rounded-lg ${
                      category.isActive
                        ? 'border-gray-200 bg-white'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-8 h-8 rounded-md flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-navy truncate">
                              {category.name}
                            </h4>
                            {!category.isActive && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                                Archived
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-navy/60">
                            Sort Order: {category.sortOrder}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCategory(category)
                            setArchiveDialogOpen(true)
                          }}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-navy/60">No categories found</p>
          </div>
        )}
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
