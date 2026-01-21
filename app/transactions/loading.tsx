import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function TransactionsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Skeleton */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r hidden lg:block">
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
        {/* Page Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm mb-6">
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="flex gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {/* Table Header */}
            <div className="border-b p-4">
              <div className="grid grid-cols-6 gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            {/* Table Rows */}
            <div className="divide-y">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="p-4">
                  <div className="grid grid-cols-6 gap-4 items-center">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
