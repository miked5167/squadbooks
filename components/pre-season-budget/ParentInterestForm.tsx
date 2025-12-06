'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle2, Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

interface ParentInterestFormProps {
  budgetSlug: string
  onSuccess?: () => void
}

export function ParentInterestForm({ budgetSlug, onSuccess }: ParentInterestFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    parentName: '',
    email: '',
    phone: '',
    playerName: '',
    playerAge: '',
    acknowledged: false,
    comments: '',
  })

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.acknowledged) {
      toast.error('Please acknowledge that you have reviewed the budget')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/pre-season-budget/public/${budgetSlug}/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          playerAge: formData.playerAge ? parseInt(formData.playerAge) : undefined,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        if (res.status === 409) {
          throw new Error('You have already expressed interest in this team')
        }
        throw new Error(error.error || 'Failed to submit interest')
      }

      setSubmitted(true)
      toast.success('Interest submitted successfully!')
      onSuccess?.()
    } catch (error) {
      console.error('Error submitting interest:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit interest')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-900 mb-2">
                Thank You for Your Interest!
              </h3>
              <p className="text-green-800 mb-4">
                We've received your information and the coach will be in touch soon.
              </p>
              <p className="text-sm text-green-700">
                You'll receive a confirmation email at <strong>{formData.email}</strong> with
                next steps.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gold/30">
      <CardHeader className="bg-gradient-to-r from-gold/10 to-gold/5">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gold/20 p-3">
            <UserPlus className="w-6 h-6 text-gold" />
          </div>
          <div>
            <CardTitle className="text-xl text-navy">Express Your Interest</CardTitle>
            <CardDescription className="text-base">
              Join this team for the upcoming season
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Parent Information */}
          <div>
            <h4 className="font-medium text-navy mb-4">Parent/Guardian Information</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="parentName">
                  Your Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="parentName"
                  value={formData.parentName}
                  onChange={(e) => handleChange('parentName', e.target.value)}
                  placeholder="John Smith"
                  required
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="john.smith@example.com"
                    required
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Player Information */}
          <div>
            <h4 className="font-medium text-navy mb-4">Player Information</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="playerName">
                    Player Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="playerName"
                    value={formData.playerName}
                    onChange={(e) => handleChange('playerName', e.target.value)}
                    placeholder="Alex Smith"
                    required
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="playerAge">Player Age (Optional)</Label>
                  <Input
                    id="playerAge"
                    type="number"
                    min="1"
                    max="25"
                    value={formData.playerAge}
                    onChange={(e) => handleChange('playerAge', e.target.value)}
                    placeholder="12"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="comments">Additional Comments (Optional)</Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => handleChange('comments', e.target.value)}
                  placeholder="Any questions or additional information..."
                  rows={3}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Acknowledgment */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="acknowledged"
                checked={formData.acknowledged}
                onCheckedChange={(checked) => handleChange('acknowledged', checked as boolean)}
                required
              />
              <div>
                <Label
                  htmlFor="acknowledged"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I acknowledge that I have reviewed the budget and understand the estimated
                  costs <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-navy/60 mt-1">
                  This is not a binding commitment, just an expression of interest
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gold hover:bg-gold/90 text-white"
              size="lg"
              disabled={loading || !formData.acknowledged}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Submit Interest
                </>
              )}
            </Button>

            <p className="text-xs text-center text-navy/60">
              By submitting this form, you agree to be contacted by the team coach
              regarding registration and next steps.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function Separator() {
  return <div className="border-t border-navy/10 my-6" />
}
