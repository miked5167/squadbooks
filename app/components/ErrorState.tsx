import React from "react"

export function ErrorState({
  title,
  message,
}: {
  title?: string
  message?: string
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <h3 className="text-sm font-semibold text-red-800">
        {title ?? "Something went wrong"}
      </h3>
      {message && (
        <p className="mt-1 text-sm text-red-700">
          {message}
        </p>
      )}
    </div>
  )
}
