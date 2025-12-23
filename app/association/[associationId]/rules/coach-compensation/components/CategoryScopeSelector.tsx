'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Category {
  id: string
  name: string
  description: string | null
}

interface CategoryScopeSelectorProps {
  categories: Category[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}

export function CategoryScopeSelector({
  categories,
  selectedIds,
  onChange,
  disabled,
}: CategoryScopeSelectorProps) {
  // Filter to show coach-related categories first
  const coachCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes('coach')
  )
  const otherCategories = categories.filter(
    (cat) => !cat.name.toLowerCase().includes('coach')
  )

  const toggleCategory = (categoryId: string) => {
    if (disabled) return

    if (selectedIds.includes(categoryId)) {
      onChange(selectedIds.filter((id) => id !== categoryId))
    } else {
      onChange([...selectedIds, categoryId])
    }
  }

  const renderCategoryGroup = (cats: Category[], title: string) => {
    if (cats.length === 0) return null

    return (
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">{title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cats.map((category) => {
            const isSelected = selectedIds.includes(category.id)

            return (
              <Card
                key={category.id}
                className={`p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-gray-300'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleCategory(category.id)}
                    disabled={disabled}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor={category.id}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {category.name}
                    </Label>
                    {category.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Selected Count Badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Selected:</span>
        <Badge variant={selectedIds.length > 0 ? 'default' : 'secondary'}>
          {selectedIds.length} {selectedIds.length === 1 ? 'category' : 'categories'}
        </Badge>
      </div>

      {/* Coach Categories (suggested) */}
      {renderCategoryGroup(coachCategories, 'Suggested Coach Categories')}

      {/* Other Categories */}
      {renderCategoryGroup(otherCategories, 'Other Expense Categories')}

      {categories.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No categories found.</p>
          <p className="text-sm mt-1">
            Please create expense categories in your association settings.
          </p>
        </div>
      )}
    </div>
  )
}
