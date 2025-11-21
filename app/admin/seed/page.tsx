'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, CheckCircle, Database } from 'lucide-react'

export default function SeedPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSeed() {
    setLoading(true)
    setSuccess(false)

    try {
      const res = await fetch('/api/admin/setup-team', {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to setup team')
      }

      toast.success(data.message)
      setSuccess(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to setup team')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="border-0 shadow-card">
          <CardHeader className="bg-gradient-to-r from-navy to-navy-medium text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Database className="w-6 h-6" />
              Complete Setup
            </CardTitle>
            <CardDescription className="text-cream/90">
              Create your team and initialize with default expense categories
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="bg-lightblue p-4 rounded-lg">
                <p className="text-navy text-sm">
                  This will create 28 default categories for your team:
                </p>
                <ul className="mt-3 space-y-1 text-sm text-navy/70">
                  <li>• Ice Time & Facilities (4 categories)</li>
                  <li>• Equipment & Jerseys (4 categories)</li>
                  <li>• Coaching & Officials (4 categories)</li>
                  <li>• Travel & Tournaments (4 categories)</li>
                  <li>• League & Registration (4 categories)</li>
                  <li>• Team Operations (4 categories)</li>
                  <li>• Fundraising & Income (4 categories)</li>
                </ul>
              </div>

              {success && (
                <div className="bg-meadow/10 border border-meadow/30 p-4 rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-meadow mt-0.5" />
                  <div>
                    <p className="font-medium text-meadow">Setup complete!</p>
                    <p className="text-sm text-navy/70 mt-1">
                      Your team has been created with 28 expense categories. You can now create expenses at{' '}
                      <a href="/expenses/new" className="text-meadow underline hover:text-meadow/80">
                        /expenses/new
                      </a>
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSeed}
                disabled={loading || success}
                className="w-full bg-navy hover:bg-navy-medium text-white"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Setup Complete
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
