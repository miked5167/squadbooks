'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { RuleForm } from './RuleForm'

interface AddRuleButtonProps {
  associationId: string
  associationCurrency: string
}

export function AddRuleButton({ associationId, associationCurrency }: AddRuleButtonProps) {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all font-medium shadow-sm"
      >
        <Plus className="w-5 h-5" />
        Add Rule
      </button>

      <RuleForm
        associationId={associationId}
        associationCurrency={associationCurrency}
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </>
  )
}
