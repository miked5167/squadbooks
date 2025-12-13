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
        <CardTitle className="text-base font-semibold text-navy">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isTreasurer && (
          <>
            <Button
              asChild
              className="w-full justify-start bg-navy hover:bg-navy-medium text-white"
            >
              <Link href="/expenses/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start border-navy/20">
              <Link href="/income/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Income
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start border-navy/20">
              <Link href="/transactions">
                <Upload className="w-4 h-4 mr-2" />
                Upload Receipt
              </Link>
            </Button>
          </>
        )}

        <Button asChild variant="ghost" className="w-full justify-start text-navy/70">
          <Link href="/transactions">
            <List className="w-4 h-4 mr-2" />
            View All Transactions
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
