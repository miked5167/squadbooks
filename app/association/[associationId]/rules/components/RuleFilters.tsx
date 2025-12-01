"use client"

import { UseFormReturn } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  TeamTypeEnum,
  AgeDivisionEnum,
  CompetitiveLevelEnum,
  type TeamType,
  type AgeDivision,
  type CompetitiveLevel,
} from "@/lib/validations/rule-schemas"

interface RuleFiltersProps {
  form: UseFormReturn<any>
}

const teamTypeLabels: Record<TeamType, string> = {
  HOUSE_LEAGUE: "House League",
  REPRESENTATIVE: "Representative (Rep/Travel)",
  ADULT_RECREATIONAL: "Adult Recreational",
  OTHER: "Other",
}

const ageDivisionLabels: Record<AgeDivision, string> = {
  U7: "U7 (Tyke)",
  U9: "U9 (Novice)",
  U11: "U11 (Atom)",
  U13: "U13 (Peewee)",
  U15: "U15 (Bantam)",
  U18: "U18 (Midget)",
  OTHER: "Other",
}

const competitiveLevelLabels: Record<CompetitiveLevel, string> = {
  AAA: "AAA (Elite)",
  AA: "AA",
  A: "A",
  BB: "BB",
  B: "B",
  MD: "MD (Multi-Divisional)",
  HOUSE_RECREATIONAL: "House/Recreational",
  NOT_APPLICABLE: "Not Applicable",
  OTHER: "Other",
}

export function RuleFilters({ form }: RuleFiltersProps) {
  const teamTypeFilter = form.watch("teamTypeFilter") || []
  const ageDivisionFilter = form.watch("ageDivisionFilter") || []
  const competitiveLevelFilter = form.watch("competitiveLevelFilter") || []

  const hasAnyFilters =
    teamTypeFilter.length > 0 ||
    ageDivisionFilter.length > 0 ||
    competitiveLevelFilter.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Targeting (Optional)</h3>
        <p className="text-sm text-gray-600">
          Choose which teams this rule applies to. Leave all unchecked to apply to{" "}
          <strong>all teams</strong>.
        </p>
        {!hasAnyFilters && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
              <Badge variant="secondary">All Teams</Badge>
              This rule will apply to every team in the association
            </p>
          </div>
        )}
      </div>

      {/* Team Type Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Type</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="teamTypeFilter"
            render={() => (
              <FormItem>
                <div className="space-y-3">
                  {TeamTypeEnum.options.map((teamType) => (
                    <FormField
                      key={teamType}
                      control={form.control}
                      name="teamTypeFilter"
                      render={({ field }) => {
                        const value = field.value || []
                        return (
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={value.includes(teamType)}
                                onCheckedChange={(checked) => {
                                  const newValue = checked
                                    ? [...value, teamType]
                                    : value.filter((v: TeamType) => v !== teamType)
                                  field.onChange(newValue)
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {teamTypeLabels[teamType]}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                <FormDescription className="mt-3">
                  Select the team types this rule should apply to
                </FormDescription>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Age Division Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Age Division</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="ageDivisionFilter"
            render={() => (
              <FormItem>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {AgeDivisionEnum.options.map((division) => (
                    <FormField
                      key={division}
                      control={form.control}
                      name="ageDivisionFilter"
                      render={({ field }) => {
                        const value = field.value || []
                        return (
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={value.includes(division)}
                                onCheckedChange={(checked) => {
                                  const newValue = checked
                                    ? [...value, division]
                                    : value.filter((v: AgeDivision) => v !== division)
                                  field.onChange(newValue)
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {ageDivisionLabels[division]}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                <FormDescription className="mt-3">
                  Select the age divisions this rule should apply to
                </FormDescription>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Competitive Level Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Competitive Level</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="competitiveLevelFilter"
            render={() => (
              <FormItem>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CompetitiveLevelEnum.options.map((level) => (
                    <FormField
                      key={level}
                      control={form.control}
                      name="competitiveLevelFilter"
                      render={({ field }) => {
                        const value = field.value || []
                        return (
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={value.includes(level)}
                                onCheckedChange={(checked) => {
                                  const newValue = checked
                                    ? [...value, level]
                                    : value.filter((v: CompetitiveLevel) => v !== level)
                                  field.onChange(newValue)
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {competitiveLevelLabels[level]}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                <FormDescription className="mt-3">
                  Select the competitive levels this rule should apply to
                </FormDescription>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  )
}
