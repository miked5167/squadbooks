/**
 * Budget category aggregation utilities
 * Handles 2-layer category model (DisplayCategory + SystemCategory)
 */

import { prisma } from '@/lib/prisma';
import type { BudgetHeadingGroup, FundingSource } from '@/lib/types/budget';

/**
 * Get expense allocations grouped by display category
 * Used for "Budget Allocation by Category" chart
 */
export async function getExpenseAllocationsByDisplayCategory(params: {
  budgetVersionId?: string;
  teamId?: string;
  season?: string;
}): Promise<BudgetHeadingGroup[]> {
  const { budgetVersionId, teamId, season } = params;

  // Query budget allocations with system categories and display categories
  const allocations = await prisma.$queryRaw<
    Array<{
      displayCategoryName: string;
      displayCategoryColor: string;
      totalAllocated: number;
      totalSpent: number;
    }>
  >`
    SELECT
      dc.name AS "displayCategoryName",
      dc.color AS "displayCategoryColor",
      SUM(ba.allocated)::NUMERIC AS "totalAllocated",
      COALESCE(SUM(t.amount), 0)::NUMERIC AS "totalSpent"
    FROM "budget_allocations" ba
    INNER JOIN "system_categories" sc ON ba."systemCategoryId" = sc.id
    INNER JOIN "display_categories" dc ON sc."displayCategoryId" = dc.id
    LEFT JOIN "transactions" t ON t."systemCategoryId" = sc.id
      AND t.status IN ('APPROVED', 'APPROVED_AUTOMATIC')
      AND t."deletedAt" IS NULL
      AND t.type = 'EXPENSE'
    WHERE sc.type = 'EXPENSE'
      ${budgetVersionId ? `AND ba."budgetVersionId" = '${budgetVersionId}'` : ''}
    GROUP BY dc.id, dc.name, dc.color, dc."sortOrder"
    ORDER BY dc."sortOrder" ASC
  `;

  // Calculate total budget for percentage calculations
  const totalBudget = allocations.reduce((sum, a) => sum + Number(a.totalAllocated), 0);

  return allocations.map((allocation) => ({
    heading: allocation.displayCategoryName,
    color: allocation.displayCategoryColor,
    allocated: Number(allocation.totalAllocated) * 100, // Convert to cents
    spent: Number(allocation.totalSpent) * 100, // Convert to cents
    percentOfTotal: totalBudget > 0 ? (Number(allocation.totalAllocated) / totalBudget) * 100 : 0,
  }));
}

/**
 * Get income by system category
 * Used for "Funding Sources" section
 */
export async function getIncomeBySystemCategory(params: {
  budgetVersionId?: string;
  teamId?: string;
  season?: string;
}): Promise<FundingSource[]> {
  const { budgetVersionId, teamId, season } = params;

  // Query budget allocations for income categories
  const incomeAllocations = await prisma.$queryRaw<
    Array<{
      systemCategoryId: string;
      systemCategoryName: string;
      totalBudgeted: number;
      totalReceived: number;
    }>
  >`
    SELECT
      sc.id AS "systemCategoryId",
      sc.name AS "systemCategoryName",
      COALESCE(SUM(ba.allocated), 0)::NUMERIC AS "totalBudgeted",
      COALESCE(SUM(t.amount), 0)::NUMERIC AS "totalReceived"
    FROM "system_categories" sc
    LEFT JOIN "budget_allocations" ba ON ba."systemCategoryId" = sc.id
      ${budgetVersionId ? `AND ba."budgetVersionId" = '${budgetVersionId}'` : ''}
    LEFT JOIN "transactions" t ON t."systemCategoryId" = sc.id
      AND t.status IN ('APPROVED', 'APPROVED_AUTOMATIC')
      AND t."deletedAt" IS NULL
      AND t.type = 'INCOME'
    WHERE sc.type = 'INCOME'
    GROUP BY sc.id, sc.name
    HAVING COALESCE(SUM(ba.allocated), 0) > 0 OR COALESCE(SUM(t.amount), 0) > 0
    ORDER BY "totalBudgeted" DESC
  `;

  // Calculate total income for percentage calculations
  const totalIncome = incomeAllocations.reduce((sum, a) => sum + Number(a.totalBudgeted), 0);

  return incomeAllocations.map((income) => ({
    systemCategoryId: income.systemCategoryId,
    name: income.systemCategoryName,
    budgeted: Number(income.totalBudgeted) * 100, // Convert to cents
    received: Number(income.totalReceived) * 100, // Convert to cents
    percentOfTotal: totalIncome > 0 ? (Number(income.totalBudgeted) / totalIncome) * 100 : 0,
  }));
}

/**
 * Get budget summary including expenses and income
 */
export async function getBudgetSummary(params: {
  budgetVersionId?: string;
  teamId: string;
  season?: string;
}) {
  const { budgetVersionId, teamId, season } = params;

  // Get expense totals
  const expenseSummary = await prisma.$queryRaw<
    Array<{ totalAllocated: number; totalSpent: number }>
  >`
    SELECT
      COALESCE(SUM(ba.allocated), 0)::NUMERIC AS "totalAllocated",
      COALESCE(SUM(t.amount), 0)::NUMERIC AS "totalSpent"
    FROM "budget_allocations" ba
    INNER JOIN "system_categories" sc ON ba."systemCategoryId" = sc.id
    LEFT JOIN "transactions" t ON t."systemCategoryId" = sc.id
      AND t.status IN ('APPROVED', 'APPROVED_AUTOMATIC')
      AND t."deletedAt" IS NULL
      AND t.type = 'EXPENSE'
    WHERE sc.type = 'EXPENSE'
      ${budgetVersionId ? `AND ba."budgetVersionId" = '${budgetVersionId}'` : ''}
  `;

  // Get income totals
  const incomeSummary = await prisma.$queryRaw<
    Array<{ totalBudgeted: number; totalReceived: number }>
  >`
    SELECT
      COALESCE(SUM(ba.allocated), 0)::NUMERIC AS "totalBudgeted",
      COALESCE(SUM(t.amount), 0)::NUMERIC AS "totalReceived"
    FROM "budget_allocations" ba
    INNER JOIN "system_categories" sc ON ba."systemCategoryId" = sc.id
    LEFT JOIN "transactions" t ON t."systemCategoryId" = sc.id
      AND t.status IN ('APPROVED', 'APPROVED_AUTOMATIC')
      AND t."deletedAt" IS NULL
      AND t.type = 'INCOME'
    WHERE sc.type = 'INCOME'
      ${budgetVersionId ? `AND ba."budgetVersionId" = '${budgetVersionId}'` : ''}
  `;

  const totalExpenseAllocated = Number(expenseSummary[0]?.totalAllocated || 0) * 100;
  const totalExpenseSpent = Number(expenseSummary[0]?.totalSpent || 0) * 100;
  const totalIncomeBudgeted = Number(incomeSummary[0]?.totalBudgeted || 0) * 100;
  const totalIncomeReceived = Number(incomeSummary[0]?.totalReceived || 0) * 100;

  return {
    totalBudget: totalExpenseAllocated,
    totalSpent: totalExpenseSpent,
    totalIncome: totalIncomeReceived,
    totalRemaining: totalExpenseAllocated - totalExpenseSpent,
    percentUsed: totalExpenseAllocated > 0 ? (totalExpenseSpent / totalExpenseAllocated) * 100 : 0,
    netPosition: totalIncomeReceived - totalExpenseSpent,
  };
}
