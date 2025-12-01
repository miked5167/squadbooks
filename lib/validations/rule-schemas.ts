import { z } from "zod"

// Rule type enum
export const RuleTypeEnum = z.enum([
  "MAX_BUDGET",
  "MAX_ASSESSMENT",
  "MAX_BUYOUT",
  "ZERO_BALANCE",
  "APPROVAL_TIERS",
  "REQUIRED_EXPENSES",
  "SIGNING_AUTHORITY_COMPOSITION",
])

export type RuleType = z.infer<typeof RuleTypeEnum>

// Base rule schema (shared fields)
const baseRuleSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

// MAX_BUDGET rule configuration
const maxBudgetConfigSchema = z.object({
  maxAmount: z.number().positive("Maximum budget must be positive"),
  currency: z.string().default("CAD"),
})

export const maxBudgetRuleSchema = baseRuleSchema.extend({
  ruleType: z.literal("MAX_BUDGET"),
  config: maxBudgetConfigSchema,
})

// MAX_ASSESSMENT rule configuration
const maxAssessmentConfigSchema = z.object({
  maxAmount: z.number().positive("Maximum assessment must be positive"),
  currency: z.string().default("CAD"),
})

export const maxAssessmentRuleSchema = baseRuleSchema.extend({
  ruleType: z.literal("MAX_ASSESSMENT"),
  config: maxAssessmentConfigSchema,
})

// MAX_BUYOUT rule configuration
const maxBuyoutConfigSchema = z.object({
  maxAmount: z.number().positive("Maximum buyout must be positive"),
  currency: z.string().default("CAD"),
})

export const maxBuyoutRuleSchema = baseRuleSchema.extend({
  ruleType: z.literal("MAX_BUYOUT"),
  config: maxBuyoutConfigSchema,
})

// ZERO_BALANCE rule configuration
const zeroBalanceConfigSchema = z.object({
  tolerance: z.number().min(0, "Tolerance cannot be negative").default(0),
  requireBalancedBudget: z.boolean().default(true),
  currency: z.string().default("CAD"),
})

export const zeroBalanceRuleSchema = baseRuleSchema.extend({
  ruleType: z.literal("ZERO_BALANCE"),
  config: zeroBalanceConfigSchema,
})

// APPROVAL_TIERS rule configuration
const approvalTierSchema = z.object({
  min: z.number().min(0, "Minimum amount cannot be negative"),
  max: z.number().positive("Maximum amount must be positive"),
  approvals: z.number().int().min(0, "Approvals must be 0 or more"),
})

export const approvalTiersRuleSchema = baseRuleSchema.extend({
  ruleType: z.literal("APPROVAL_TIERS"),
  config: z.object({
    currency: z.string().default("CAD"),
  }),
  approvalTiers: z
    .array(approvalTierSchema)
    .min(1, "At least one tier is required")
    .refine(
      (tiers) => {
        // Validate that tiers don't overlap and are in ascending order
        for (let i = 0; i < tiers.length - 1; i++) {
          if (tiers[i].max > tiers[i + 1].min) {
            return false
          }
        }
        return true
      },
      { message: "Tiers must not overlap and should be in ascending order" }
    ),
})

// REQUIRED_EXPENSES rule configuration
export const requiredExpensesRuleSchema = baseRuleSchema.extend({
  ruleType: z.literal("REQUIRED_EXPENSES"),
  config: z.object({
    enforceStrict: z.boolean().default(true),
  }),
  requiredExpenses: z
    .array(z.string().min(1, "Category name cannot be empty"))
    .min(1, "At least one required category is needed"),
})

// SIGNING_AUTHORITY_COMPOSITION rule configuration (GTHL compliance)
const signingAuthorityCompositionSchema = z.object({
  min_team_officials: z.number().int().min(0, "Cannot be negative").default(1),
  min_parent_representatives: z
    .number()
    .int()
    .min(0, "Cannot be negative")
    .default(2),
  min_total: z.number().int().min(1, "Total must be at least 1").default(3),
  require_finance_experience: z.boolean().default(true),
  require_background_check: z.boolean().default(true),
})

export const signingAuthorityRuleSchema = baseRuleSchema.extend({
  ruleType: z.literal("SIGNING_AUTHORITY_COMPOSITION"),
  config: z.object({}), // No basic config for this rule type
  signingAuthorityComposition: signingAuthorityCompositionSchema.refine(
    (data) => {
      // Validate that min_total >= min_team_officials + min_parent_representatives
      return data.min_total >= data.min_team_officials + data.min_parent_representatives
    },
    {
      message:
        "Total required signing authorities must be at least the sum of required team officials and parent representatives",
    }
  ),
})

// Union of all rule schemas
export const ruleSchema = z.discriminatedUnion("ruleType", [
  maxBudgetRuleSchema,
  maxAssessmentRuleSchema,
  maxBuyoutRuleSchema,
  zeroBalanceRuleSchema,
  approvalTiersRuleSchema,
  requiredExpensesRuleSchema,
  signingAuthorityRuleSchema,
])

export type RuleFormData = z.infer<typeof ruleSchema>

// Rule type metadata for UI
export const ruleTypeMetadata: Record<
  RuleType,
  {
    label: string
    description: string
    icon: string
    color: string
  }
> = {
  MAX_BUDGET: {
    label: "Maximum Budget",
    description: "Set a maximum total budget limit for teams",
    icon: "DollarSign",
    color: "blue",
  },
  MAX_ASSESSMENT: {
    label: "Maximum Assessment",
    description: "Cap the maximum registration fee per player",
    icon: "Users",
    color: "green",
  },
  MAX_BUYOUT: {
    label: "Maximum Buyout",
    description: "Limit fundraising buyout amounts per family",
    icon: "Gift",
    color: "purple",
  },
  ZERO_BALANCE: {
    label: "Zero Balance",
    description: "Require budgets to balance to zero",
    icon: "Scale",
    color: "amber",
  },
  APPROVAL_TIERS: {
    label: "Approval Tiers",
    description: "Define approval requirements based on transaction amounts",
    icon: "CheckCircle",
    color: "indigo",
  },
  REQUIRED_EXPENSES: {
    label: "Required Expenses",
    description: "Mandate specific budget categories",
    icon: "List",
    color: "rose",
  },
  SIGNING_AUTHORITY_COMPOSITION: {
    label: "Signing Authority",
    description: "GTHL signing authority composition requirements",
    icon: "Shield",
    color: "teal",
  },
}
