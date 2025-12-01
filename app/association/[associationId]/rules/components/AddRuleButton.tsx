'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'

interface AddRuleButtonProps {
  associationId: string
}

export function AddRuleButton({ associationId }: AddRuleButtonProps) {
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

      {/* TODO: Add Rule Dialog Modal */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4">Add New Rule</h2>
            <p className="text-gray-600 mb-4">
              Rule creation form coming in Phase 3.1...
            </p>
            <button
              onClick={() => setShowDialog(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
