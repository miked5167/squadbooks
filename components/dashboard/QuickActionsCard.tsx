import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, List, Upload, ArrowRight } from 'lucide-react'

interface QuickActionsCardProps {
  isTreasurer: boolean
}

export function QuickActionsCard({ isTreasurer }: QuickActionsCardProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-navy font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isTreasurer && (
          <>
            <Button
              asChild
              className="bg-navy hover:bg-navy-medium w-full justify-start text-white"
            >
              <Link href="/expenses/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Link>
            </Button>

            <Button asChild variant="outline" className="border-navy/20 w-full justify-start">
              <Link href="/income/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Income
              </Link>
            </Button>

            <Button asChild variant="outline" className="border-navy/20 w-full justify-start">
              <Link href="/transactions">
                <Upload className="mr-2 h-4 w-4" />
                Upload Receipt
              </Link>
            </Button>
          </>
        )}

        <Button asChild variant="ghost" className="text-navy/70 w-full justify-start">
          <Link href="/transactions">
            <List className="mr-2 h-4 w-4" />
            View All Transactions
            <ArrowRight className="ml-auto h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
