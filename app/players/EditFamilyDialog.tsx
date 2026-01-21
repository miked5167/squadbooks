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
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Family {
  id: string
  familyName: string
  primaryName: string | null
  primaryEmail: string
  primaryPhone: string | null
  secondaryName: string | null
  secondaryEmail: string | null
  secondaryPhone: string | null
}

interface EditFamilyDialogProps {
  family: Family
  isOpen: boolean
  onClose: () => void
}

export function EditFamilyDialog({ family, isOpen, onClose }: EditFamilyDialogProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    familyName: family.familyName,
    primaryName: family.primaryName || '',
    primaryEmail: family.primaryEmail,
    primaryPhone: family.primaryPhone || '',
    secondaryName: family.secondaryName || '',
    secondaryEmail: family.secondaryEmail || '',
    secondaryPhone: family.secondaryPhone || '',
  })

  const handleSave = async () => {
    // Validate
    if (!formData.familyName.trim()) {
      toast.error('Family name is required')
      return
    }
    if (!formData.primaryEmail.trim()) {
      toast.error('Primary email is required')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/families/${family.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          familyName: formData.familyName.trim(),
          primaryName: formData.primaryName.trim() || null,
          primaryEmail: formData.primaryEmail.trim(),
          primaryPhone: formData.primaryPhone.trim() || null,
          secondaryName: formData.secondaryName.trim() || null,
          secondaryEmail: formData.secondaryEmail.trim() || null,
          secondaryPhone: formData.secondaryPhone.trim() || null,
        }),
      })

      if (res.ok) {
        toast.success('Family updated successfully')
        onClose()
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update family')
      }
    } catch (err) {
      console.error('Failed to update family:', err)
      toast.error('Failed to update family')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Family</DialogTitle>
          <DialogDescription>Update family information and guardian contact details</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Family Name */}
          <div className="space-y-2">
            <Label htmlFor="familyName">Family Name</Label>
            <Input
              id="familyName"
              value={formData.familyName}
              onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
              placeholder="Smith Family"
            />
          </div>

          {/* Primary Guardian */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-navy">Primary Parent / Guardian</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryName">Name</Label>
                <Input
                  id="primaryName"
                  value={formData.primaryName}
                  onChange={(e) => setFormData({ ...formData, primaryName: e.target.value })}
                  placeholder="John Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryPhone">Phone</Label>
                <Input
                  id="primaryPhone"
                  type="tel"
                  value={formData.primaryPhone}
                  onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryEmail">Email</Label>
              <Input
                id="primaryEmail"
                type="email"
                value={formData.primaryEmail}
                onChange={(e) => setFormData({ ...formData, primaryEmail: e.target.value })}
                placeholder="john.smith@example.com"
              />
            </div>
          </div>

          {/* Secondary Guardian */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-navy">Secondary Parent / Guardian (Optional)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="secondaryName">Name</Label>
                <Input
                  id="secondaryName"
                  value={formData.secondaryName}
                  onChange={(e) => setFormData({ ...formData, secondaryName: e.target.value })}
                  placeholder="Jane Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryPhone">Phone</Label>
                <Input
                  id="secondaryPhone"
                  type="tel"
                  value={formData.secondaryPhone}
                  onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                  placeholder="(555) 987-6543"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryEmail">Email</Label>
              <Input
                id="secondaryEmail"
                type="email"
                value={formData.secondaryEmail}
                onChange={(e) => setFormData({ ...formData, secondaryEmail: e.target.value })}
                placeholder="jane.smith@example.com"
              />
            </div>
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
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
