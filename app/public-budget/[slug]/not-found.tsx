import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-navy/20">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy mb-2">Budget Not Found</h1>
            <p className="text-navy/70 mb-4">
              This budget link is invalid, has expired, or the budget hasn't been approved yet.
            </p>
            <p className="text-sm text-navy/60 mb-6">
              If you received this link from a coach, please contact them to verify the
              correct link.
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
