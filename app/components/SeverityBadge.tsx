import React from "react"

export function SeverityBadge({
  severity,
}: {
  severity: "LOW" | "MEDIUM" | "HIGH"
}) {
  const base = "inline-flex rounded-full px-2 py-0.5 text-xs font-medium"

  if (severity === "HIGH") {
    return <span className={`${base} bg-red-100 text-red-800`}>High</span>
  }

  if (severity === "MEDIUM") {
    return <span className={`${base} bg-yellow-100 text-yellow-800`}>Medium</span>
  }

  return <span className={`${base} bg-gray-100 text-gray-800`}>Low</span>
}
