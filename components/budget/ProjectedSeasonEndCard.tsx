/**
 * ProjectedSeasonEndCard Component
 * Prominent card showing projected season-end surplus or deficit
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingUp, TrendingDown, HelpCircle } from 'lucide-react'

interface ProjectedSeasonEndCardProps {
  projectedSurplusDeficit: number
}

export function ProjectedSeasonEndCard({ projectedSurplusDeficit }: ProjectedSeasonEndCardProps) {
  const isSurplus = projectedSurplusDeficit >= 0
  // Convert from cents to dollars
  const amount = Math.abs(projectedSurplusDeficit / 100)

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-1.5">
          <CardDescription className="text-navy/60 text-sm font-medium">
            Projected Season-End
          </CardDescription>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-navy/40 hover:text-navy/60 transition-colors">
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-navy text-white max-w-xs">
                <p>Based on current trends in income and spending</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardTitle className={`text-3xl sm:text-4xl font-bold ${isSurplus ? 'text-green-600' : 'text-red-600'}`}>
          {isSurplus ? '+' : '-'}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1.5">
          {isSurplus ? (
            <>
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Projected surplus at season end</span>
            </>
          ) : (
            <>
              <TrendingDown className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-700">Projected shortfall at season end</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
