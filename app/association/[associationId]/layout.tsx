import { AssociationSidebar } from '@/components/association-sidebar'

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
      <AssociationSidebar associationId={associationId} />
      <main className="ml-64">
        {children}
      </main>
    </div>
  )
}
