'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createRule } from '../actions'

interface AddRuleButtonProps {
  associationId: string
  associationCurrency: string
}

const ruleTypes = [
  { value: 'MAX_BUDGET', label: 'Maximum Team Budget', description: 'Set a cap on total team budgets' },
  { value: 'MAX_ASSESSMENT', label: 'Maximum Assessment', description: 'Limit per-player assessment amounts' },
  { value: 'MAX_BUYOUT', label: 'Maximum Buyout', description: 'Cap buyout/refund amounts' },
  { value: 'APPROVAL_TIERS', label: 'Approval Tiers', description: 'Require approvals based on amount' },
  { value: 'ZERO_BALANCE', label: 'Zero Balance Target', description: 'Require zero balance by season end' },
  { value: 'REQUIRED_EXPENSES', label: 'Required Expenses', description: 'Mandate specific expense categories' },
  { value: 'SIGNING_AUTHORITY', label: 'Signing Authority', description: 'Require multiple signatures for payments' },
  { value: 'COACH_COMPENSATION', label: 'Coach Compensation', description: 'Limit coach payment amounts' },
]

export function AddRuleButton({ associationId, associationCurrency }: AddRuleButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ruleType, setRuleType] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [maxAmount, setMaxAmount] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ruleType || !name) return

    setLoading(true)

    const config: any = {}
    if (['MAX_BUDGET', 'MAX_ASSESSMENT', 'MAX_BUYOUT', 'COACH_COMPENSATION'].includes(ruleType)) {
      config.maxAmount = parseFloat(maxAmount) || 0
      config.currency = associationCurrency
    }

    const result = await createRule({
      associationId,
      ruleType,
      name,
      description: description || undefined,
      config,
      isActive: true,
    })

    setLoading(false)

    if (result.success) {
      setOpen(false)
      setRuleType('')
      setName('')
      setDescription('')
      setMaxAmount('')
      router.refresh()
    }
  }

  const needsAmountConfig = ['MAX_BUDGET', 'MAX_ASSESSMENT', 'MAX_BUYOUT', 'COACH_COMPENSATION'].includes(ruleType)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Rule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Governance Rule</DialogTitle>
          <DialogDescription>
            Add a new financial governance rule for your association.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ruleType">Rule Type</Label>
            <Select value={ruleType} onValueChange={setRuleType}>
              <SelectTrigger>
                <SelectValue placeholder="Select a rule type" />
              </SelectTrigger>
              <SelectContent>
                {ruleTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Maximum Team Budget"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this rule enforces..."
              rows={2}
            />
          </div>

          {needsAmountConfig && (
            <div className="space-y-2">
              <Label htmlFor="maxAmount">Maximum Amount ({associationCurrency})</Label>
              <Input
                id="maxAmount"
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="e.g., 20000"
                min="0"
                step="0.01"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !ruleType || !name}>
              {loading ? 'Creating...' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
