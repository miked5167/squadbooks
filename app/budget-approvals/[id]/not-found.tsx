import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="border-navy/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-navy/10 p-3">
                <FileQuestion className="h-6 w-6 text-navy" />
              </div>
              <div>
                <CardTitle className="text-navy">Budget Approval Not Found</CardTitle>
                <CardDescription>
                  The budget approval you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-navy/70">
              This could happen if:
            </p>
            <ul className="text-sm text-navy/70 list-disc list-inside space-y-1">
              <li>The link you followed is incorrect or outdated</li>
              <li>The budget approval was deleted</li>
              <li>You don&apos;t have permission to view this budget approval</li>
            </ul>
            <div className="flex gap-3">
              <Button asChild className="bg-navy hover:bg-navy-medium">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button variant="outline" onClick={() => window.history.back()}>
                Go back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
