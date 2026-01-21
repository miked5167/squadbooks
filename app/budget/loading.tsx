import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function BudgetLoading() {
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
            <Skeleton className="h-9 w-32 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Budget Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Budget Categories */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
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
