import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: string
    isPositive?: boolean
  }
  badge?: {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
  }
  className?: string
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  badge,
  className,
}: KpiCardProps) {
  return (
    <Card className={cn('border-0 shadow-sm hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-navy/5 rounded-lg">
              <Icon className="w-5 h-5 text-navy" />
            </div>
            <span className="text-sm font-medium text-navy/60">{title}</span>
          </div>
          {badge && (
            <Badge
              variant={badge.variant}
              className={cn(
                'text-xs font-semibold',
                badge.variant === 'success' &&
                  'bg-green-100 text-green-800 hover:bg-green-100',
                badge.variant === 'warning' &&
                  'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
              )}
            >
              {badge.label}
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-3xl font-bold text-navy">{value}</div>
          {subtitle && <p className="text-sm text-navy/60">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 text-sm">
              <span
                className={cn(
                  'font-medium',
                  trend.isPositive === undefined
                    ? 'text-navy/60'
                    : trend.isPositive
                    ? 'text-green-600'
                    : 'text-red-600'
                )}
              >
                {trend.value}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
