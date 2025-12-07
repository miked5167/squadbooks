import { prisma } from '@/lib/prisma'
import type { Prisma, PreSeasonBudgetStatus } from '@prisma/client'
import { customAlphabet } from 'nanoid'
import slugify from 'slugify'
import type {
  CreatePreSeasonBudgetInput,
  UpdatePreSeasonBudgetInput,
  UpdateAllocationsInput,
  ParentInterestInput,
  PreSeasonBudgetFilter,
} from '@/lib/validations/pre-season-budget'

// Nanoid for generating unique slugs
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6)

/**
 * Generate a unique public slug for the budget
 */
function generatePublicSlug(teamName: string, ageDivision: string | null, season: string): string {
  const baseSlug = slugify(teamName, { lower: true, strict: true })
  const division = ageDivision ? `-${ageDivision.toLowerCase()}` : ''
  const year = season.split('-')[0]
  const unique = nanoid()
  return `${baseSlug}${division}-${year}-${unique}`
}

/**
 * Calculate per-player cost
 */
function calculatePerPlayerCost(totalBudget: number, projectedPlayers: number): number {
  if (projectedPlayers === 0) return 0
  return Number((totalBudget / projectedPlayers).toFixed(2))
}

// ============================================
// COACH OPERATIONS
// ============================================

/**
 * Create a new pre-season budget (draft)
 */
export async function createPreSeasonBudget(
  data: CreatePreSeasonBudgetInput,
  createdByClerkId: string
): Promise<string> {
  const perPlayerCost = calculatePerPlayerCost(data.totalBudget, data.projectedPlayers)

  const budget = await prisma.preSeasonBudget.create({
    data: {
      proposedTeamName: data.proposedTeamName,
      proposedSeason: data.proposedSeason,
      teamType: data.teamType,
      ageDivision: data.ageDivision,
      competitiveLevel: data.competitiveLevel,
      totalBudget: data.totalBudget,
      projectedPlayers: data.projectedPlayers,
      perPlayerCost,
      createdByClerkId,
      associationId: data.associationId,
      publicSlug: '', // Will be set on approval
      status: 'DRAFT',
    },
  })

  return budget.id
}

/**
 * Get a single pre-season budget by ID
 */
export async function getPreSeasonBudget(id: string, clerkId: string) {
  const budget = await prisma.preSeasonBudget.findUnique({
    where: { id },
    include: {
      allocations: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              heading: true,
              color: true,
              type: true,
            },
          },
        },
        orderBy: {
          category: {
            sortOrder: 'asc',
          },
        },
      },
      parentInterests: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!budget) {
    throw new Error('Pre-season budget not found')
  }

  // Authorization check: only creator or association admins can access
  if (budget.createdByClerkId !== clerkId) {
    // TODO: Check if user is association admin for this budget's association
    // For now, allow only creator
    throw new Error('Forbidden: You do not have access to this budget')
  }

  return budget
}

/**
 * List all budgets created by a user
 */
export async function listUserBudgets(clerkId: string, status?: PreSeasonBudgetStatus) {
  const where: Prisma.PreSeasonBudgetWhereInput = {
    createdByClerkId: clerkId,
  }

  if (status) {
    where.status = status
  }

  const budgets = await prisma.preSeasonBudget.findMany({
    where,
    include: {
      _count: {
        select: {
          parentInterests: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return budgets
}

/**
 * Get association requirements and user's submission status
 */
export async function getBudgetRequirements(associationId: string, clerkId: string) {
  const association = await prisma.association.findUnique({
    where: { id: associationId },
    select: {
      preSeasonBudgetDeadline: true,
      preSeasonBudgetsRequired: true,
      preSeasonBudgetAutoApprove: true,
    },
  })

  if (!association) {
    throw new Error('Association not found')
  }

  // Count user's submitted/approved budgets for this association
  const submittedCount = await prisma.preSeasonBudget.count({
    where: {
      associationId,
      createdByClerkId: clerkId,
      status: {
        in: ['SUBMITTED', 'APPROVED', 'ACTIVATED'],
      },
    },
  })

  const hasDeadline = !!association.preSeasonBudgetDeadline
  const isPastDeadline = hasDeadline
    ? new Date() > new Date(association.preSeasonBudgetDeadline!)
    : false

  const requirementsMet = association.preSeasonBudgetsRequired
    ? submittedCount >= association.preSeasonBudgetsRequired
    : true // No requirement = always met

  return {
    deadline: association.preSeasonBudgetDeadline,
    requiredCount: association.preSeasonBudgetsRequired,
    submittedCount,
    autoApprove: association.preSeasonBudgetAutoApprove,
    hasDeadline,
    isPastDeadline,
    requirementsMet,
    canSubmitMore:
      !isPastDeadline && (association.preSeasonBudgetsRequired === null || !requirementsMet),
  }
}

/**
 * Update budget details (only in DRAFT or REJECTED status)
 */
export async function updateBudgetDetails(
  id: string,
  clerkId: string,
  updates: UpdatePreSeasonBudgetInput
) {
  // Get budget and check authorization
  const budget = await prisma.preSeasonBudget.findUnique({
    where: { id },
    select: {
      createdByClerkId: true,
      status: true,
      projectedPlayers: true,
      totalBudget: true,
    },
  })

  if (!budget) {
    throw new Error('Pre-season budget not found')
  }

  if (budget.createdByClerkId !== clerkId) {
    throw new Error('Forbidden: You do not have access to this budget')
  }

  if (budget.status !== 'DRAFT' && budget.status !== 'REJECTED') {
    throw new Error('Cannot modify budget that is not in DRAFT or REJECTED status')
  }

  // Calculate new per-player cost if needed
  let perPlayerCost: number | undefined
  if (updates.totalBudget !== undefined || updates.projectedPlayers !== undefined) {
    const newBudget = updates.totalBudget ?? budget.totalBudget
    const newPlayers = updates.projectedPlayers ?? budget.projectedPlayers
    perPlayerCost = calculatePerPlayerCost(Number(newBudget), newPlayers)
  }

  const updated = await prisma.preSeasonBudget.update({
    where: { id },
    data: {
      ...updates,
      ...(perPlayerCost !== undefined && { perPlayerCost }),
    },
  })

  return updated
}

/**
 * Update category allocations for a pre-season budget
 */
export async function updateAllocations(id: string, clerkId: string, data: UpdateAllocationsInput) {
  // Get budget and check authorization
  const budget = await prisma.preSeasonBudget.findUnique({
    where: { id },
    select: {
      createdByClerkId: true,
      status: true,
      totalBudget: true,
    },
  })

  if (!budget) {
    throw new Error('Pre-season budget not found')
  }

  if (budget.createdByClerkId !== clerkId) {
    throw new Error('Forbidden: You do not have access to this budget')
  }

  if (budget.status !== 'DRAFT' && budget.status !== 'REJECTED') {
    throw new Error('Cannot modify allocations for budget not in DRAFT or REJECTED status')
  }

  // Validate total allocations equals budget total (within $0.01 tolerance)
  const totalAllocated = data.allocations.reduce((sum, a) => sum + a.allocated, 0)
  const budgetTotal = Number(budget.totalBudget)

  if (Math.abs(totalAllocated - budgetTotal) > 0.01) {
    throw new Error(
      `Total allocations ($${totalAllocated.toFixed(2)}) must equal total budget ($${budgetTotal.toFixed(2)})`
    )
  }

  // Update allocations in a transaction
  await prisma.$transaction(async tx => {
    // Delete existing allocations
    await tx.preSeasonAllocation.deleteMany({
      where: { preSeasonBudgetId: id },
    })

    // Create new allocations
    await tx.preSeasonAllocation.createMany({
      data: data.allocations.map(allocation => ({
        preSeasonBudgetId: id,
        categoryId: allocation.categoryId,
        allocated: allocation.allocated,
        notes: allocation.notes,
      })),
    })
  })

  return { success: true }
}

/**
 * Submit budget for association approval
 */
export async function submitForApproval(id: string, clerkId: string) {
  // Get budget and check authorization
  const budget = await prisma.preSeasonBudget.findUnique({
    where: { id },
    include: {
      allocations: true,
      association: {
        select: {
          preSeasonBudgetDeadline: true,
          preSeasonBudgetAutoApprove: true,
        },
      },
    },
  })

  if (!budget) {
    throw new Error('Pre-season budget not found')
  }

  if (budget.createdByClerkId !== clerkId) {
    throw new Error('Forbidden: You do not have access to this budget')
  }

  if (budget.status !== 'DRAFT' && budget.status !== 'REJECTED') {
    throw new Error('Can only submit budgets in DRAFT or REJECTED status')
  }

  // Check deadline enforcement
  if (budget.association?.preSeasonBudgetDeadline) {
    const now = new Date()
    const deadline = new Date(budget.association.preSeasonBudgetDeadline)
    if (now > deadline) {
      throw new Error(
        `Budget submission deadline has passed (${deadline.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })})`
      )
    }
  }

  // Validate allocations exist and total matches budget
  if (budget.allocations.length === 0) {
    throw new Error('Cannot submit budget without category allocations')
  }

  const totalAllocated = budget.allocations.reduce((sum, a) => sum + Number(a.allocated), 0)
  const budgetTotal = Number(budget.totalBudget)

  if (Math.abs(totalAllocated - budgetTotal) > 0.01) {
    throw new Error('Total allocations must equal total budget before submitting')
  }

  // Determine status based on auto-approve setting
  const shouldAutoApprove = budget.association?.preSeasonBudgetAutoApprove || false
  const newStatus = shouldAutoApprove ? 'APPROVED' : 'SUBMITTED'

  // Generate public slug if auto-approving
  let publicSlug: string | undefined
  if (shouldAutoApprove) {
    publicSlug = generatePublicSlug(
      budget.proposedTeamName,
      budget.ageDivision,
      budget.proposedSeason
    )
  }

  // Update status
  const updated = await prisma.preSeasonBudget.update({
    where: { id },
    data: {
      status: newStatus,
      ...(shouldAutoApprove && {
        associationApprovedAt: new Date(),
        associationApprovedBy: 'AUTO_APPROVED',
        associationNotes: 'Automatically approved based on association settings',
        publicSlug,
      }),
    },
  })

  // TODO: Send email notification
  // - If auto-approved: send approval email to coach with public link
  // - If pending: send notification to association admin

  return updated
}

/**
 * Delete/cancel a budget (only in DRAFT status)
 */
export async function deleteBudget(id: string, clerkId: string) {
  const budget = await prisma.preSeasonBudget.findUnique({
    where: { id },
    select: {
      createdByClerkId: true,
      status: true,
    },
  })

  if (!budget) {
    throw new Error('Pre-season budget not found')
  }

  if (budget.createdByClerkId !== clerkId) {
    throw new Error('Forbidden: You do not have access to this budget')
  }

  if (budget.status !== 'DRAFT') {
    throw new Error('Can only delete budgets in DRAFT status')
  }

  // Soft delete by updating status
  await prisma.preSeasonBudget.update({
    where: { id },
    data: {
      status: 'CANCELLED',
    },
  })

  return { success: true }
}

// ============================================
// ASSOCIATION ADMIN OPERATIONS
// ============================================

/**
 * List all budgets for an association (pending approval)
 */
export async function listAssociationBudgets(
  associationId: string,
  status?: PreSeasonBudgetStatus
) {
  const where: Prisma.PreSeasonBudgetWhereInput = {
    associationId,
  }

  if (status) {
    where.status = status
  } else {
    // Default to showing submitted budgets
    where.status = 'SUBMITTED'
  }

  const budgets = await prisma.preSeasonBudget.findMany({
    where,
    include: {
      allocations: {
        include: {
          category: {
            select: {
              name: true,
              heading: true,
            },
          },
        },
      },
      _count: {
        select: {
          parentInterests: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return budgets
}

/**
 * Approve a pre-season budget
 */
export async function approveBudget(id: string, adminClerkId: string, notes?: string) {
  const budget = await prisma.preSeasonBudget.findUnique({
    where: { id },
    select: {
      status: true,
      proposedTeamName: true,
      ageDivision: true,
      proposedSeason: true,
      publicSlug: true,
    },
  })

  if (!budget) {
    throw new Error('Pre-season budget not found')
  }

  if (budget.status !== 'SUBMITTED') {
    throw new Error('Can only approve budgets in SUBMITTED status')
  }

  // Generate public slug if not already set
  const publicSlug =
    budget.publicSlug ||
    generatePublicSlug(budget.proposedTeamName, budget.ageDivision, budget.proposedSeason)

  const updated = await prisma.preSeasonBudget.update({
    where: { id },
    data: {
      status: 'APPROVED',
      associationApprovedAt: new Date(),
      associationApprovedBy: adminClerkId,
      associationNotes: notes,
      publicSlug,
    },
  })

  // TODO: Send approval email to coach with public link

  return updated
}

/**
 * Reject a pre-season budget
 */
export async function rejectBudget(id: string, adminClerkId: string, notes: string) {
  const budget = await prisma.preSeasonBudget.findUnique({
    where: { id },
    select: {
      status: true,
    },
  })

  if (!budget) {
    throw new Error('Pre-season budget not found')
  }

  if (budget.status !== 'SUBMITTED') {
    throw new Error('Can only reject budgets in SUBMITTED status')
  }

  const updated = await prisma.preSeasonBudget.update({
    where: { id },
    data: {
      status: 'REJECTED',
      associationApprovedAt: new Date(),
      associationApprovedBy: adminClerkId,
      associationNotes: notes,
    },
  })

  // TODO: Send rejection email to coach with notes

  return updated
}

// ============================================
// PUBLIC OPERATIONS
// ============================================

/**
 * Get public budget by slug (for prospective parents)
 */
export async function getPublicBudget(slug: string) {
  const budget = await prisma.preSeasonBudget.findUnique({
    where: { publicSlug: slug },
    include: {
      allocations: {
        include: {
          category: {
            select: {
              name: true,
              heading: true,
              color: true,
              type: true,
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
          parentInterests: {
            where: {
              acknowledged: true,
            },
          },
        },
      },
    },
  })

  if (!budget) {
    throw new Error('Budget not found')
  }

  if (budget.status !== 'APPROVED') {
    throw new Error('This budget is not publicly available')
  }

  // Increment view count
  await prisma.preSeasonBudget.update({
    where: { id: budget.id },
    data: {
      viewCount: {
        increment: 1,
      },
    },
  })

  return budget
}

/**
 * Submit parent interest/acknowledgment
 */
export async function submitParentInterest(
  slug: string,
  data: ParentInterestInput,
  ipAddress?: string,
  userAgent?: string
) {
  // Get budget by slug
  const budget = await prisma.preSeasonBudget.findUnique({
    where: { publicSlug: slug },
    select: {
      id: true,
      status: true,
    },
  })

  if (!budget) {
    throw new Error('Budget not found')
  }

  if (budget.status !== 'APPROVED') {
    throw new Error('Cannot express interest in budget that is not approved')
  }

  // Create interest record (will fail if email already exists for this budget due to unique constraint)
  const interest = await prisma.parentInterest.create({
    data: {
      preSeasonBudgetId: budget.id,
      parentName: data.parentName,
      email: data.email,
      phone: data.phone,
      playerName: data.playerName,
      playerAge: data.playerAge,
      acknowledged: data.acknowledged,
      acknowledgedAt: data.acknowledged ? new Date() : null,
      comments: data.comments,
      ipAddress,
      userAgent,
    },
  })

  // TODO: Send confirmation email to parent
  // TODO: Send notification email to coach

  return interest
}

/**
 * Get interest count for a budget
 */
export async function getInterestCount(budgetId: string): Promise<number> {
  return prisma.parentInterest.count({
    where: {
      preSeasonBudgetId: budgetId,
      acknowledged: true,
    },
  })
}

/**
 * List all interests for a budget
 */
export async function listInterests(budgetId: string, clerkId: string) {
  // Verify user owns this budget
  const budget = await prisma.preSeasonBudget.findUnique({
    where: { id: budgetId },
    select: {
      createdByClerkId: true,
    },
  })

  if (!budget) {
    throw new Error('Budget not found')
  }

  if (budget.createdByClerkId !== clerkId) {
    throw new Error('Forbidden: You do not have access to this budget')
  }

  return prisma.parentInterest.findMany({
    where: {
      preSeasonBudgetId: budgetId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

// ============================================
// ACTIVATION
// ============================================

/**
 * Activate budget and create team
 */
export async function activateBudget(
  id: string,
  clerkId: string,
  minimumInterests: number = 8
): Promise<{ teamId: string }> {
  // Get budget with all related data
  const budget = await prisma.preSeasonBudget.findUnique({
    where: { id },
    include: {
      allocations: {
        include: {
          category: true,
        },
      },
      parentInterests: {
        where: {
          acknowledged: true,
        },
      },
    },
  })

  if (!budget) {
    throw new Error('Pre-season budget not found')
  }

  if (budget.createdByClerkId !== clerkId) {
    throw new Error('Forbidden: You do not have access to this budget')
  }

  if (budget.status !== 'APPROVED') {
    throw new Error('Can only activate budgets in APPROVED status')
  }

  // Check minimum interest threshold
  if (budget.parentInterests.length < minimumInterests) {
    throw new Error(
      `Minimum ${minimumInterests} parent acknowledgments required. Current: ${budget.parentInterests.length}`
    )
  }

  // Create team and related records in a transaction
  const result = await prisma.$transaction(async tx => {
    // Create Team
    const team = await tx.team.create({
      data: {
        name: budget.proposedTeamName,
        season: budget.proposedSeason,
        budgetTotal: budget.totalBudget,
        teamType: budget.teamType as any,
        ageDivision: budget.ageDivision as any,
        competitiveLevel: budget.competitiveLevel as any,
      },
    })

    // Copy budget allocations
    await tx.budgetAllocation.createMany({
      data: budget.allocations.map(allocation => ({
        teamId: team.id,
        categoryId: allocation.categoryId,
        season: budget.proposedSeason,
        allocated: allocation.allocated,
      })),
    })

    // Create Family records from parent interests
    const families = await Promise.all(
      budget.parentInterests.map(interest =>
        tx.family.create({
          data: {
            teamId: team.id,
            familyName: interest.parentName,
            primaryName: interest.parentName,
            primaryEmail: interest.email,
            primaryPhone: interest.phone,
            players: {
              create: {
                teamId: team.id,
                firstName: interest.playerName.split(' ')[0] || interest.playerName,
                lastName: interest.playerName.split(' ').slice(1).join(' ') || '',
                playerAge: interest.playerAge,
              },
            },
          },
        })
      )
    )

    // Update budget status to ACTIVATED
    await tx.preSeasonBudget.update({
      where: { id },
      data: {
        status: 'ACTIVATED',
        activatedAt: new Date(),
        activatedTeamId: team.id,
      },
    })

    return { teamId: team.id }
  })

  // TODO: Send invitation emails to parents with Clerk signup links

  return result
}
