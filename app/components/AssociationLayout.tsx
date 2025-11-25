import React from "react"
import { AssociationNav } from "./AssociationNav"

interface AssociationLayoutProps {
  associationId: string
  title: string
  children: React.ReactNode
  headerRight?: React.ReactNode
  breadcrumbs?: React.ReactNode
}

export function AssociationLayout({
  associationId,
  title,
  children,
  headerRight,
  breadcrumbs,
}: AssociationLayoutProps) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {breadcrumbs && (
        <div className="mb-2 text-xs text-gray-500" aria-label="Breadcrumb">
          {breadcrumbs}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {headerRight && <div>{headerRight}</div>}
      </div>

      <AssociationNav associationId={associationId} />

      <div className="mt-4 space-y-4">
        {children}
      </div>
    </main>
  )
}
