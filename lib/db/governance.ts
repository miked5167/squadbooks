/**
 * Database queries for Association Governance Rules
 * Manages budget approval workflow and parent acknowledgment threshold settings
 */

import { prisma } from "@/lib/prisma";
import {
  ParentAckMode,
  EligibleFamilyDefinition,
  Prisma,
} from "@prisma/client";

export type GovernanceRuleInput = {
  requiresAssociationBudgetApproval: boolean;
  parentAckMode: ParentAckMode;
  parentAckCountThreshold?: number | null;
  parentAckPercentThreshold?: number | null;
  eligibleFamilyDefinition: EligibleFamilyDefinition;
  allowTeamOverrideThreshold: boolean;
  overrideMinPercent?: number | null;
  overrideMaxPercent?: number | null;
  overrideMinCount?: number | null;
  overrideMaxCount?: number | null;
};

/**
 * Get governance rules for an association
 * Returns null if no rules are set (use defaults)
 */
export async function getGovernanceRules(associationId: string) {
  return await prisma.associationGovernanceRule.findUnique({
    where: { associationId },
  });
}

/**
 * Get governance rules with defaults if none exist
 */
export async function getGovernanceRulesWithDefaults(
  associationId: string
): Promise<GovernanceRuleInput> {
  const rules = await getGovernanceRules(associationId);

  if (rules) {
    return {
      requiresAssociationBudgetApproval: rules.requiresAssociationBudgetApproval,
      parentAckMode: rules.parentAckMode,
      parentAckCountThreshold: rules.parentAckCountThreshold,
      parentAckPercentThreshold: rules.parentAckPercentThreshold,
      eligibleFamilyDefinition: rules.eligibleFamilyDefinition,
      allowTeamOverrideThreshold: rules.allowTeamOverrideThreshold,
      overrideMinPercent: rules.overrideMinPercent,
      overrideMaxPercent: rules.overrideMaxPercent,
      overrideMinCount: rules.overrideMinCount,
      overrideMaxCount: rules.overrideMaxCount,
    };
  }

  // Default values if no rules exist
  return {
    requiresAssociationBudgetApproval: false,
    parentAckMode: "PERCENT" as ParentAckMode,
    parentAckCountThreshold: null,
    parentAckPercentThreshold: 80,
    eligibleFamilyDefinition: "ACTIVE_ROSTER_ONLY" as EligibleFamilyDefinition,
    allowTeamOverrideThreshold: false,
    overrideMinPercent: null,
    overrideMaxPercent: null,
    overrideMinCount: null,
    overrideMaxCount: null,
  };
}

/**
 * Create or update governance rules for an association
 */
export async function upsertGovernanceRules(
  associationId: string,
  data: GovernanceRuleInput
) {
  // Validate threshold values based on mode
  if (data.parentAckMode === "PERCENT") {
    if (
      !data.parentAckPercentThreshold ||
      data.parentAckPercentThreshold < 1 ||
      data.parentAckPercentThreshold > 100
    ) {
      throw new Error("Percent threshold must be between 1 and 100");
    }
    // Clear count threshold if using percent mode
    data.parentAckCountThreshold = null;
  } else if (data.parentAckMode === "COUNT") {
    if (!data.parentAckCountThreshold || data.parentAckCountThreshold < 1) {
      throw new Error("Count threshold must be at least 1");
    }
    // Clear percent threshold if using count mode
    data.parentAckPercentThreshold = null;
  }

  // Validate override bounds if enabled
  if (data.allowTeamOverrideThreshold) {
    if (data.parentAckMode === "PERCENT") {
      if (
        data.overrideMinPercent &&
        data.overrideMaxPercent &&
        data.overrideMinPercent > data.overrideMaxPercent
      ) {
        throw new Error("Override min percent cannot exceed max percent");
      }
    } else if (data.parentAckMode === "COUNT") {
      if (
        data.overrideMinCount &&
        data.overrideMaxCount &&
        data.overrideMinCount > data.overrideMaxCount
      ) {
        throw new Error("Override min count cannot exceed max count");
      }
    }
  } else {
    // Clear override bounds if not allowed
    data.overrideMinPercent = null;
    data.overrideMaxPercent = null;
    data.overrideMinCount = null;
    data.overrideMaxCount = null;
  }

  return await prisma.associationGovernanceRule.upsert({
    where: { associationId },
    create: {
      associationId,
      ...data,
    },
    update: data,
  });
}

/**
 * Check if association requires budget approval before parent presentation
 */
export async function requiresAssociationApproval(
  associationId: string
): Promise<boolean> {
  const rules = await getGovernanceRules(associationId);
  return rules?.requiresAssociationBudgetApproval ?? false;
}

/**
 * Get parent acknowledgment threshold config for a team's association
 * Used when creating a new budget to snapshot the governance rules
 */
export async function getParentThresholdConfig(associationId: string) {
  const rules = await getGovernanceRulesWithDefaults(associationId);

  return {
    mode: rules.parentAckMode === "PERCENT" ? ("PERCENT" as const) : ("COUNT" as const),
    percentThreshold:
      rules.parentAckMode === "PERCENT"
        ? rules.parentAckPercentThreshold
        : null,
    countThreshold:
      rules.parentAckMode === "COUNT" ? rules.parentAckCountThreshold : null,
  };
}

/**
 * Delete governance rules for an association (reset to defaults)
 */
export async function deleteGovernanceRules(associationId: string) {
  return await prisma.associationGovernanceRule.delete({
    where: { associationId },
  });
}
