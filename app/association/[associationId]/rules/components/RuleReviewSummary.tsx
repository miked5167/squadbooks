"use client"

import { RuleType, TeamType, AgeDivision, CompetitiveLevel } from "@/lib/validations/rule-schemas"
import { getCurrencySymbol } from "@/lib/utils/currency"
import { DollarSign, Users, Gift, Scale, CheckCircle, List, Shield, Target } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface RuleReviewSummaryProps {
  ruleType: RuleType
  config: any
  approvalTiers?: any[]
  requiredExpenses?: string[]
  signingAuthorityComposition?: any
  teamTypeFilter?: TeamType[]
  ageDivisionFilter?: AgeDivision[]
  competitiveLevelFilter?: CompetitiveLevel[]
  currency: string
}

const teamTypeLabels: Record<TeamType, string> = {
  HOUSE_LEAGUE: "House League",
  REPRESENTATIVE: "Rep/Travel",
  ADULT_RECREATIONAL: "Adult Rec",
  OTHER: "Other",
}

const ageDivisionLabels: Record<AgeDivision, string> = {
  U7: "U7",
  U9: "U9",
  U11: "U11",
  U13: "U13",
  U15: "U15",
  U18: "U18",
  OTHER: "Other",
}

const competitiveLevelLabels: Record<CompetitiveLevel, string> = {
  AAA: "AAA",
  AA: "AA",
  A: "A",
  BB: "BB",
  B: "B",
  MD: "MD",
  HOUSE_RECREATIONAL: "House/Rec",
  NOT_APPLICABLE: "N/A",
  OTHER: "Other",
}

export function RuleReviewSummary({
  ruleType,
  config,
  approvalTiers,
  requiredExpenses,
  signingAuthorityComposition,
  teamTypeFilter,
  ageDivisionFilter,
  competitiveLevelFilter,
  currency,
}: RuleReviewSummaryProps) {
  const currencySymbol = getCurrencySymbol(currency)

  const hasFilters =
    (teamTypeFilter && teamTypeFilter.length > 0) ||
    (ageDivisionFilter && ageDivisionFilter.length > 0) ||
    (competitiveLevelFilter && competitiveLevelFilter.length > 0)

  const renderFilters = () => {
    if (!hasFilters) {
      return (
        <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-200">
          <Target className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-gray-600">Applies to:</span>
          <Badge variant="secondary">All Teams</Badge>
        </div>
      )
    }

    return (
      <div className="pt-3 mt-3 border-t border-gray-200 space-y-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">Applies to:</span>
        </div>

        {teamTypeFilter && teamTypeFilter.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-gray-600">Type:</span>
            {teamTypeFilter.map((type) => (
              <Badge key={type} variant="outline" className="text-xs">
                {teamTypeLabels[type]}
              </Badge>
            ))}
          </div>
        )}

        {ageDivisionFilter && ageDivisionFilter.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-gray-600">Age:</span>
            {ageDivisionFilter.map((division) => (
              <Badge key={division} variant="outline" className="text-xs">
                {ageDivisionLabels[division]}
              </Badge>
            ))}
          </div>
        )}

        {competitiveLevelFilter && competitiveLevelFilter.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-gray-600">Level:</span>
            {competitiveLevelFilter.map((level) => (
              <Badge key={level} variant="outline" className="text-xs">
                {competitiveLevelLabels[level]}
              </Badge>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderMaxAmountRule = (label: string, icon: typeof DollarSign) => {
    const Icon = icon
    return (
      <div>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-50">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-gray-900">
              {currencySymbol}
              {config.maxAmount?.toLocaleString() || '0'} {currency}
            </p>
          </div>
        </div>
        {renderFilters()}
      </div>
    )
  }

  switch (ruleType) {
    case "MAX_BUDGET":
      return renderMaxAmountRule("Maximum Budget Amount", DollarSign)

    case "MAX_ASSESSMENT":
      return (
        <div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Maximum Assessment per Player</p>
              <p className="text-2xl font-bold text-gray-900">
                {currencySymbol}
                {config.maxAmount?.toLocaleString() || '0'} {currency}
              </p>
            </div>
          </div>
          {renderFilters()}
        </div>
      )

    case "MAX_BUYOUT":
      return (
        <div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-pink-50">
              <Gift className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Maximum Buyout per Family</p>
              <p className="text-2xl font-bold text-gray-900">
                {currencySymbol}
                {config.maxAmount?.toLocaleString() || '0'} {currency}
              </p>
            </div>
          </div>
          {renderFilters()}
        </div>
      )

    case "ZERO_BALANCE":
      return (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <Scale className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Balance Requirement</p>
              <p className="text-lg font-medium text-gray-900">
                {config.requireBalancedBudget
                  ? "Budget must balance to zero"
                  : "Budget balance not enforced"}
              </p>
            </div>
          </div>
          {config.tolerance > 0 && (
            <div className="ml-12 pl-4 border-l-2 border-gray-200">
              <p className="text-sm text-muted-foreground">Acceptable Variance</p>
              <p className="font-medium text-gray-900">
                ±{currencySymbol}{config.tolerance?.toLocaleString()} {currency}
              </p>
            </div>
          )}
          {renderFilters()}
        </div>
      )

    case "APPROVAL_TIERS":
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50">
              <CheckCircle className="w-5 h-5 text-amber-600" />
            </div>
            <p className="font-medium text-gray-900">Approval Requirements by Amount</p>
          </div>
          <div className="ml-12">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-2 text-muted-foreground font-medium">Amount Range</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Approvals Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {approvalTiers?.map((tier, index) => (
                  <tr key={index}>
                    <td className="py-2 font-medium">
                      {currencySymbol}{tier.min.toLocaleString()} - {currencySymbol}{tier.max.toLocaleString()}
                    </td>
                    <td className="py-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tier.approvals} {tier.approvals === 1 ? 'approval' : 'approvals'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {renderFilters()}
        </div>
      )

    case "REQUIRED_EXPENSES":
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-50">
              <List className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Required Budget Categories</p>
              <p className="text-sm text-muted-foreground">
                {config.enforceStrict ? "Strictly enforced" : "Recommended"}
              </p>
            </div>
          </div>
          <div className="ml-12">
            <ul className="space-y-2">
              {requiredExpenses?.map((expense, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                  <span className="font-medium text-gray-900">{expense}</span>
                </li>
              ))}
            </ul>
          </div>
          {renderFilters()}
        </div>
      )

    case "SIGNING_AUTHORITY_COMPOSITION":
      return (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-50">
              <Shield className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">GTHL Signing Authority Requirements</p>
              <p className="text-lg font-medium text-gray-900">
                Minimum {signingAuthorityComposition?.min_total || 0} signing authorities required
              </p>
            </div>
          </div>
          <div className="ml-12 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-muted-foreground">Team Officials</p>
                <p className="text-lg font-semibold text-gray-900">
                  {signingAuthorityComposition?.min_team_officials || 0} minimum
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-muted-foreground">Parent Representatives</p>
                <p className="text-lg font-semibold text-gray-900">
                  {signingAuthorityComposition?.min_parent_representatives || 0} minimum
                </p>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-700">Additional Requirements:</p>
              <div className="flex flex-col gap-1.5">
                {signingAuthorityComposition?.require_finance_experience && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Finance experience required</span>
                  </div>
                )}
                {signingAuthorityComposition?.require_background_check && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Background check required</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {renderFilters()}
        </div>
      )

    default:
      return (
        <div className="text-sm text-muted-foreground">
          No configuration details available
        </div>
      )
  }
}
