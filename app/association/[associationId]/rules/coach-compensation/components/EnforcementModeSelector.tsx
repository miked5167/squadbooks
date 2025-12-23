'use client'

import { cn } from '@/lib/utils'
import { AlertCircle, AlertTriangle, Shield } from 'lucide-react'

type EnforcementMode = 'WARN_ONLY' | 'REQUIRE_EXCEPTION' | 'BLOCK'

interface EnforcementModeSelectorProps {
  value: EnforcementMode
  onChange: (mode: EnforcementMode) => void
  disabled?: boolean
}

const modes: Array<{
  value: EnforcementMode
  label: string
  description: string
  icon: React.ElementType
  color: string
}> = [
  {
    value: 'WARN_ONLY',
    label: 'Warn Only',
    description: 'Show warnings but allow transactions to proceed',
    icon: AlertCircle,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
  },
  {
    value: 'REQUIRE_EXCEPTION',
    label: 'Require Exception',
    description: 'Block transactions until an approved exception exists',
    icon: AlertTriangle,
    color: 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100',
  },
  {
    value: 'BLOCK',
    label: 'Block',
    description: 'Strictly block all transactions that exceed caps',
    icon: Shield,
    color: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100',
  },
]

export function EnforcementModeSelector({ value, onChange, disabled }: EnforcementModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {modes.map((mode) => {
        const Icon = mode.icon
        const isSelected = value === mode.value

        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => !disabled && onChange(mode.value)}
            disabled={disabled}
            className={cn(
              'relative flex flex-col items-start p-4 border-2 rounded-lg text-left transition-all',
              isSelected
                ? mode.color
                : 'bg-white border-gray-200 hover:border-gray-300',
              disabled && 'opacity-50 cursor-not-allowed',
              !disabled && !isSelected && 'hover:border-gray-300'
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-5 w-5" />
              <span className="font-semibold">{mode.label}</span>
            </div>
            <p className="text-sm opacity-80">{mode.description}</p>

            {isSelected && (
              <div className="absolute top-2 right-2">
                <div className="h-2 w-2 rounded-full bg-current" />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
