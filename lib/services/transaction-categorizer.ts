/**
 * Transaction Categorizer Service
 *
 * Provides AI-powered category suggestions for imported bank transactions
 * based on merchant names, transaction patterns, and amounts.
 */

import type {
  PlaidTransaction,
  CategorySuggestion,
  CategorizationRule,
} from '@/lib/types/banking';

/**
 * Hockey Team Category Mapping Rules
 *
 * These rules match common hockey team transactions to budget categories.
 * Confidence scores: 90+ = High, 70-89 = Medium, <70 = Low
 */
export const CATEGORIZATION_RULES: CategorizationRule[] = [
  // Ice Rental & Facility Costs
  {
    pattern: /ice\s*(time|rental)|arena|rink/i,
    categoryId: 'ice-rental',
    categoryName: 'Ice Rental',
    confidence: 95,
    description: 'Ice time and arena rental',
  },
  {
    pattern: /community\s*arena|civic\s*center/i,
    categoryId: 'ice-rental',
    categoryName: 'Ice Rental',
    confidence: 90,
    description: 'Arena facility fees',
  },

  // Player Registration & Fees
  {
    pattern: /registration|player\s*fee|roster/i,
    categoryId: 'player-fees',
    categoryName: 'Player Fees',
    confidence: 95,
    description: 'Player registration and fees',
  },
  {
    pattern: /\$[65]00\s*-\s*\$800.*family|family.*\$[65]00/i,
    categoryId: 'player-fees',
    categoryName: 'Player Fees',
    confidence: 85,
    description: 'Typical registration fee amount',
  },

  // Equipment & Uniforms
  {
    pattern: /jersey|uniform|equipment|hockey\s*supply|pro\s*hockey/i,
    categoryId: 'equipment',
    categoryName: 'Equipment',
    confidence: 95,
    description: 'Team equipment and uniforms',
  },
  {
    pattern: /goalie|puck|cone|training\s*equipment/i,
    categoryId: 'equipment',
    categoryName: 'Equipment',
    confidence: 90,
    description: 'Hockey gear and training equipment',
  },

  // Tournament Fees
  {
    pattern: /tournament|championship|invitational/i,
    categoryId: 'tournaments',
    categoryName: 'Tournaments',
    confidence: 95,
    description: 'Tournament registration and fees',
  },
  {
    pattern: /travel\s*team|away\s*game/i,
    categoryId: 'tournaments',
    categoryName: 'Tournaments',
    confidence: 80,
    description: 'Travel and tournament expenses',
  },

  // Fundraising Income
  {
    pattern: /fundraiser|fundraising|car\s*wash|bake\s*sale|donation/i,
    categoryId: 'fundraising',
    categoryName: 'Fundraising',
    confidence: 95,
    description: 'Fundraising income',
  },

  // Team Supplies
  {
    pattern: /first\s*aid|water\s*bottle|snack|team\s*store/i,
    categoryId: 'team-supplies',
    categoryName: 'Team Supplies',
    confidence: 90,
    description: 'Team supplies and essentials',
  },

  // Coaching & Training
  {
    pattern: /coach|certification|training\s*course/i,
    categoryId: 'coaching',
    categoryName: 'Coaching',
    confidence: 90,
    description: 'Coaching fees and certifications',
  },

  // Administrative Costs
  {
    pattern: /software|subscription|website|insurance/i,
    categoryId: 'administrative',
    categoryName: 'Administrative',
    confidence: 85,
    description: 'Administrative and operational costs',
  },

  // Miscellaneous
  {
    pattern: /miscellaneous|other|general/i,
    categoryId: 'miscellaneous',
    categoryName: 'Miscellaneous',
    confidence: 50,
    description: 'Other expenses',
  },
];

/**
 * Categorize a single transaction
 */
export function categorizeTransaction(
  transaction: PlaidTransaction
): CategorySuggestion | null {
  const { name, amount, category: plaidCategory } = transaction;

  // Check against all rules
  const matches: CategorySuggestion[] = [];

  for (const rule of CATEGORIZATION_RULES) {
    // Test against merchant name
    if (rule.pattern instanceof RegExp && rule.pattern.test(name)) {
      matches.push({
        categoryId: rule.categoryId,
        categoryName: rule.categoryName,
        confidence: rule.confidence,
        reason: `Matched "${name}" to ${rule.description}`,
      });
    }
  }

  // Check Plaid's own categorization
  if (plaidCategory && plaidCategory.length > 0) {
    const plaidCat = plaidCategory[0].toLowerCase();

    // Map Plaid categories to our categories
    if (plaidCat.includes('recreation') || plaidCat.includes('sports')) {
      matches.push({
        categoryId: 'ice-rental',
        categoryName: 'Ice Rental',
        confidence: 75,
        reason: 'Plaid categorized as recreation/sports',
      });
    }
  }

  // Amount-based heuristics
  if (amount >= 600 && amount <= 850) {
    matches.push({
      categoryId: 'player-fees',
      categoryName: 'Player Fees',
      confidence: 70,
      reason: 'Amount matches typical registration fee',
    });
  } else if (amount >= 300 && amount <= 500) {
    matches.push({
      categoryId: 'ice-rental',
      categoryName: 'Ice Rental',
      confidence: 65,
      reason: 'Amount matches typical ice rental cost',
    });
  } else if (amount >= 1000 && amount <= 2000) {
    matches.push({
      categoryId: 'equipment',
      categoryName: 'Equipment',
      confidence: 65,
      reason: 'Amount matches typical equipment purchase',
    });
  }

  // Return highest confidence match
  if (matches.length > 0) {
    matches.sort((a, b) => b.confidence - a.confidence);
    return matches[0];
  }

  return null;
}

/**
 * Categorize multiple transactions in bulk
 */
export function categorizeTransactions(
  transactions: PlaidTransaction[]
): Map<string, CategorySuggestion> {
  const results = new Map<string, CategorySuggestion>();

  for (const transaction of transactions) {
    const suggestion = categorizeTransaction(transaction);
    if (suggestion) {
      results.set(transaction.id, suggestion);
    }
  }

  return results;
}

/**
 * Get categorization statistics
 */
export function getCategorizationStats(
  transactions: PlaidTransaction[],
  suggestions: Map<string, CategorySuggestion>
) {
  const total = transactions.length;
  const categorized = suggestions.size;
  const uncategorized = total - categorized;

  const confidenceBuckets = {
    high: 0, // 90+
    medium: 0, // 70-89
    low: 0, // <70
  };

  for (const suggestion of suggestions.values()) {
    if (suggestion.confidence >= 90) {
      confidenceBuckets.high++;
    } else if (suggestion.confidence >= 70) {
      confidenceBuckets.medium++;
    } else {
      confidenceBuckets.low++;
    }
  }

  return {
    total,
    categorized,
    uncategorized,
    confidence: confidenceBuckets,
    percentCategorized: total > 0 ? (categorized / total) * 100 : 0,
  };
}

/**
 * Suggest category for a new transaction based on similar past transactions
 */
export function suggestCategoryFromHistory(
  transaction: PlaidTransaction,
  historicalTransactions: PlaidTransaction[]
): CategorySuggestion | null {
  // Find similar transactions (same merchant or similar amount)
  const similar = historicalTransactions.filter((tx) => {
    const nameSimilarity = tx.name.toLowerCase() === transaction.name.toLowerCase();
    const amountSimilarity = Math.abs(tx.amount - transaction.amount) < 50;
    return nameSimilarity || (amountSimilarity && tx.assignedCategoryId);
  });

  if (similar.length > 0 && similar[0].assignedCategoryId) {
    return {
      categoryId: similar[0].assignedCategoryId,
      categoryName: similar[0].suggestedCategoryName || 'Previous Category',
      confidence: 80,
      reason: `Similar to previous transaction "${similar[0].name}"`,
    };
  }

  return null;
}
