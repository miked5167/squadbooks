"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "overview", label: "Overview" },
  { href: "alerts", label: "Alerts" },
  { href: "financials", label: "Financials" },
  { href: "reports", label: "Reports" },
  { href: "settings", label: "Settings" },
]

export function AssociationNav({ associationId }: { associationId: string }) {
  const pathname = usePathname()

  return (
    <nav className="mb-4 flex gap-4 border-b border-gray-200 pb-2 text-sm">
      {links.map(link => {
        const fullHref = `/association/${associationId}/${link.href}`
        const isActive = pathname.startsWith(fullHref)

        return (
          <Link
            key={link.href}
            href={fullHref}
            className={
              "pb-1 border-b-2 " +
              (isActive
                ? "border-indigo-500 font-medium text-indigo-600"
                : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800")
            }
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
