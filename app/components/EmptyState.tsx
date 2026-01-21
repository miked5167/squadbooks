import React from "react"

export function EmptyState({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
    </div>
  )
}
