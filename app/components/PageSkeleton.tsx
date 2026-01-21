import React from "react"

export function PageSkeleton({ title }: { title?: string }) {
  return (
    <div className="animate-pulse space-y-4">
      {title && <div className="h-6 w-48 rounded bg-gray-200" />}
      <div className="h-4 w-full rounded bg-gray-200" />
      <div className="h-4 w-5/6 rounded bg-gray-200" />
      <div className="h-64 w-full rounded bg-gray-200" />
    </div>
  )
}
