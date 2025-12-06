import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PublicBudgetView } from '@/components/pre-season-budget/PublicBudgetView'

export default async function PublicBudgetPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Fetch budget with allocations - no auth required
  const budget = await prisma.preSeasonBudget.findUnique({
    where: {
      publicSlug: slug,
      status: 'APPROVED', // Only show approved budgets
    },
    include: {
      allocations: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              heading: true,
              color: true,
            },
          },
        },
        orderBy: {
          category: {
            sortOrder: 'asc',
          },
        },
      },
      _count: {
        select: {
          parentInterests: true,
        },
      },
    },
  })

  if (!budget) {
    notFound()
  }

  // Increment view count asynchronously (don't await)
  prisma.preSeasonBudget
    .update({
      where: { id: budget.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch((err) => console.error('Failed to increment view count:', err))

  // Convert Decimals to numbers for client component
  const budgetData = {
    ...budget,
    totalBudget: Number(budget.totalBudget),
    perPlayerCost: Number(budget.perPlayerCost),
    allocations: budget.allocations.map((alloc) => ({
      ...alloc,
      allocated: Number(alloc.allocated),
    })),
  }

  return <PublicBudgetView budget={budgetData} />
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const budget = await prisma.preSeasonBudget.findUnique({
    where: {
      publicSlug: slug,
      status: 'APPROVED',
    },
    select: {
      proposedTeamName: true,
      proposedSeason: true,
      perPlayerCost: true,
    },
  })

  if (!budget) {
    return {
      title: 'Budget Not Found',
    }
  }

  const formattedCost = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(budget.perPlayerCost))

  return {
    title: `${budget.proposedTeamName} - ${budget.proposedSeason} Budget`,
    description: `Transparent season budget for ${budget.proposedTeamName}. Per player cost: ${formattedCost}. See the complete breakdown and express your interest.`,
  }
}
