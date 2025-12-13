/**
 * Budget Allocations Table Component
 *
 * Displays budget allocations by category with totals
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { BudgetAllocationDetail } from '@/lib/types/budget-workflow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BudgetAllocationsTableProps {
  allocations: BudgetAllocationDetail[]
  showCard?: boolean
  showNotes?: boolean
}

export function BudgetAllocationsTable({
  allocations,
  showCard = true,
  showNotes = false,
}: BudgetAllocationsTableProps) {
  // Group by heading
  const groupedByHeading = allocations.reduce((acc, allocation) => {
    const heading = allocation.categoryHeading
    if (!acc[heading]) {
      acc[heading] = []
    }
    acc[heading].push(allocation)
    return acc
  }, {} as Record<string, BudgetAllocationDetail[]>)

  const totalBudget = allocations.reduce((sum, a) => sum + a.allocated, 0)

  const table = (
    <div className="rounded-md border border-navy/10">
      <Table>
        <TableHeader>
          <TableRow className="border-navy/10 hover:bg-transparent">
            <TableHead className="text-navy/70">Category</TableHead>
            <TableHead className="text-navy/70">Heading</TableHead>
            {showNotes && <TableHead className="text-navy/70">Notes</TableHead>}
            <TableHead className="text-right text-navy/70">Allocated</TableHead>
            <TableHead className="text-right text-navy/70">% of Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(groupedByHeading).map(([heading, items]) => (
            <>
              {/* Heading Row */}
              <TableRow key={`heading-${heading}`} className="bg-navy/5 hover:bg-navy/5">
                <TableCell colSpan={showNotes ? 5 : 4} className="font-semibold text-navy">
                  {heading}
                </TableCell>
              </TableRow>
              {/* Category Rows */}
              {items.map((allocation) => {
                const percentage = totalBudget > 0 ? (allocation.allocated / totalBudget) * 100 : 0
                return (
                  <TableRow key={allocation.id} className="border-navy/10">
                    <TableCell className="text-sm text-navy/80 pl-8">
                      {allocation.categoryName}
                    </TableCell>
                    <TableCell className="text-sm text-navy/60">{allocation.categoryHeading}</TableCell>
                    {showNotes && (
                      <TableCell className="text-sm text-navy/60">
                        {allocation.notes || '-'}
                      </TableCell>
                    )}
                    <TableCell className="text-right font-semibold text-navy">
                      ${allocation.allocated.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right text-sm text-navy/60">
                      {percentage.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                )
              })}
            </>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-navy/5 hover:bg-navy/5">
            <TableCell colSpan={showNotes ? 3 : 2} className="font-bold text-navy">
              Total Budget
            </TableCell>
            <TableCell className="text-right font-bold text-navy text-lg">
              ${totalBudget.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </TableCell>
            <TableCell className="text-right font-semibold text-navy">100%</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )

  if (showCard) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-navy">
            Budget Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>{table}</CardContent>
      </Card>
    )
  }

  return table
}
