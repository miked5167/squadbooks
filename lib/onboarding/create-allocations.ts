import { prisma } from '@/lib/prisma';

export async function createDefaultBudgetAllocations(
  teamId: string,
  season: string,
  budgetTotal: number
) {
  // Get all categories for this team
  const categories = await prisma.category.findMany({
    where: { teamId },
    orderBy: { sortOrder: 'asc' },
  });

  // Default allocation percentages by heading
  const allocations: Record<string, number> = {
    'Ice & Facilities': 0.55,
    'Equipment & Uniforms': 0.10,
    'Tournament & League Fees': 0.12,
    'Travel & Accommodation': 0.10,
    'Coaching & Officials': 0.08,
    'Fundraising & Events': 0.02,
    'Administrative': 0.02,
    'Other': 0.01,
  };

  // Calculate allocation per heading
  const categoryAllocations = categories.map((category) => {
    const headingPercentage = allocations[category.heading || 'Other'] || 0;

    // Count subcategories in this heading
    const subcategoryCount = categories.filter(
      (c) => c.heading === category.heading
    ).length;

    // Divide heading allocation equally among subcategories
    const allocated = Math.round((budgetTotal * headingPercentage) / subcategoryCount);

    return {
      teamId,
      categoryId: category.id,
      season,
      allocated,
    };
  });

  // Create all allocations
  await prisma.budgetAllocation.createMany({
    data: categoryAllocations,
  });
}
