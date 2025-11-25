"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function AssociationBreadcrumbs({
  associationId,
  associationName,
}: {
  associationId: string
  associationName?: string | null
}) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  // Example paths:
  // /association/[id]/overview
  // /association/[id]/alerts
  // /association/[id]/teams/[teamId]

  const section = segments[2] ?? "overview"

  const sectionLabelMap: Record<string, string> = {
    overview: "Overview",
    alerts: "Alerts",
    financials: "Financials",
    settings: "Settings",
    reports: "Reports",
    teams: "Teams",
  }

  const sectionLabel = sectionLabelMap[section] ?? section

  return (
    <nav className="text-xs text-gray-500" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1">
        <li>
          <Link
            href={`/association/${associationId}/overview`}
            className="hover:underline"
          >
            {associationName ?? "Association"}
          </Link>
        </li>
        <li aria-hidden="true">›</li>
        <li className="text-gray-600">{sectionLabel}</li>
      </ol>
    </nav>
  )
}
