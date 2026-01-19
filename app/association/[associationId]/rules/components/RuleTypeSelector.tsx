'use client'

import type { RuleType } from '@/lib/validations/rule-schemas'
import { ruleTypeMetadata } from '@/lib/validations/rule-schemas'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Users, Gift, Scale, CheckCircle, List, Shield } from 'lucide-react'

const iconMap = {
  DollarSign,
  Users,
  Gift,
  Scale,
  CheckCircle,
  List,
  Shield,
}

interface RuleTypeSelectorProps {
  selectedType: RuleType | null
  onSelect: (type: RuleType) => void
}

export function RuleTypeSelector({ selectedType, onSelect }: RuleTypeSelectorProps) {
  const ruleTypes: RuleType[] = [
    'MAX_BUDGET',
    'MAX_ASSESSMENT',
    'MAX_BUYOUT',
    'ZERO_BALANCE',
    'APPROVAL_TIERS',
    'REQUIRED_EXPENSES',
    'SIGNING_AUTHORITY_COMPOSITION',
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {ruleTypes.map(ruleType => {
        const metadata = ruleTypeMetadata[ruleType]
        const Icon = iconMap[metadata.icon as keyof typeof iconMap]
        const isSelected = selectedType === ruleType

        return (
          <Card
            key={ruleType}
            className={`cursor-pointer transition-all hover:shadow-md ${
              isSelected
                ? 'ring-primary border-primary bg-primary/5 ring-2'
                : 'hover:border-primary/50'
            }`}
            onClick={() => onSelect(ruleType)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-lg p-2 ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>{metadata.label}</CardTitle>
                  </div>
                </div>
                {isSelected && (
                  <Badge variant="default" className="ml-2">
                    Selected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">{metadata.description}</CardDescription>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
