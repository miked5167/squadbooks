'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Family {
  id: string
  familyName: string
}

interface AddPlayerDialogProps {
  isOpen: boolean
  onClose: () => void
  families: Family[]
}

export function AddPlayerDialog({ isOpen, onClose, families }: AddPlayerDialogProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    jerseyNumber: '',
    position: '',
    dateOfBirth: '',
    familyId: '',
    status: 'ACTIVE',
  })

  const handleSave = async () => {
    // Validate required fields
    if (!formData.firstName.trim()) {
      toast.error('First name is required')
      return
    }
    if (!formData.lastName.trim()) {
      toast.error('Last name is required')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          jerseyNumber: formData.jerseyNumber.trim() || null,
          position: formData.position.trim() || null,
          dateOfBirth: formData.dateOfBirth || null,
          familyId: formData.familyId || null,
          status: formData.status,
        }),
      })

      if (res.ok) {
        toast.success('Player added successfully')
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          jerseyNumber: '',
          position: '',
          dateOfBirth: '',
          familyId: '',
          status: 'ACTIVE',
        })
        onClose()
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to add player')
      }
    } catch (err) {
      console.error('Failed to add player:', err)
      toast.error('Failed to add player')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Player</DialogTitle>
          <DialogDescription>Add a new player to your team roster</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Alex"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Johnson"
              />
            </div>
          </div>

          {/* Jersey Number and Position */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jerseyNumber">Jersey Number</Label>
              <Input
                id="jerseyNumber"
                value={formData.jerseyNumber}
                onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                placeholder="12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Forward"
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
          </div>

          {/* Family */}
          <div className="space-y-2">
            <Label htmlFor="family">Link to Family (Optional)</Label>
            <Select
              value={formData.familyId || 'none'}
              onValueChange={(value) => setFormData({ ...formData, familyId: value === 'none' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a family" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No family</SelectItem>
                {families.map((family) => (
                  <SelectItem key={family.id} value={family.id}>
                    {family.familyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INJURED">Injured</SelectItem>
                <SelectItem value="AP">AP (Affiliate Player)</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-navy hover:bg-navy-medium text-white"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Player'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
