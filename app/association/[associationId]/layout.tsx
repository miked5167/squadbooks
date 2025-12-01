import { AssociationSidebar } from '@/components/association-sidebar'
import { MobileHeader } from '@/components/MobileHeader'

interface AssociationLayoutProps {
  children: React.ReactNode
  params: Promise<{
    associationId: string
  }>
}

export default async function AssociationLayout({
  children,
  params,
}: AssociationLayoutProps) {
  const { associationId } = await params

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title="Command Center">
        <AssociationSidebar associationId={associationId} />
      </MobileHeader>
      <AssociationSidebar associationId={associationId} />
      <main className="ml-0 lg:ml-64">
        {children}
      </main>
    </div>
  )
}
