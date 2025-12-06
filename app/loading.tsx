import { Skeleton } from '@/components/ui/skeleton'

/**
 * Root Loading State
 *
 * This component is displayed while Next.js is loading page data.
 * It provides a consistent loading experience across the application.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header Skeleton */}
      <div className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between px-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex flex-1">
        {/* Sidebar Skeleton (hidden on mobile) */}
        <div className="hidden md:flex w-64 flex-col border-r bg-white p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Page Content Skeleton */}
        <div className="flex-1 p-6 space-y-6">
          {/* Page Header */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>

          {/* Table Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
