"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Shield, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ParentAckMode = "COUNT" | "PERCENT";
type EligibleFamilyDefinition = "ACTIVE_ROSTER_ONLY" | "ACTIVE_ROSTER_AND_PAID" | "ALL_FAMILIES";

interface GovernanceRules {
  requiresAssociationBudgetApproval: boolean;
  parentAckMode: ParentAckMode;
  parentAckCountThreshold: number | null;
  parentAckPercentThreshold: number | null;
  eligibleFamilyDefinition: EligibleFamilyDefinition;
  allowTeamOverrideThreshold: boolean;
  overrideMinPercent: number | null;
  overrideMaxPercent: number | null;
  overrideMinCount: number | null;
  overrideMaxCount: number | null;
}

export default function GovernancePage() {
  const params = useParams();
  const associationId = params.associationId as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<GovernanceRules | null>(null);

  useEffect(() => {
    loadGovernanceRules();
  }, [associationId]);

  async function loadGovernanceRules() {
    try {
      setLoading(true);
      const response = await fetch(`/api/association-governance/${associationId}`, {
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load governance rules");
      }
      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error("Error loading governance rules:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load governance rules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function saveGovernanceRules() {
    if (!rules) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/association-governance/${associationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rules),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save governance rules");
      }

      toast({
        title: "Success",
        description: "Governance rules saved successfully",
      });
    } catch (error) {
      console.error("Error saving governance rules:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save governance rules",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!rules) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load governance rules</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <Link
          href={`/association/${associationId}/rules`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Financial Rules
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Workflow & Approval Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Configure budget approval workflow and parent acknowledgment requirements for all teams
        </p>
      </div>

      <div className="space-y-6">
        {/* Association Budget Approval */}
        <Card>
          <CardHeader>
            <CardTitle>Association Budget Approval</CardTitle>
            <CardDescription>
              Control whether budgets must be approved by association finance administrators before
              being presented to parents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="requires-approval" className="text-base font-medium">
                  Require Association Approval
                </Label>
                <p className="text-sm text-muted-foreground">
                  If enabled, budgets must be approved by an association finance admin after coach
                  approval and before parent presentation
                </p>
              </div>
              <Switch
                id="requires-approval"
                checked={rules.requiresAssociationBudgetApproval}
                onCheckedChange={(checked) =>
                  setRules({ ...rules, requiresAssociationBudgetApproval: checked })
                }
              />
            </div>

            {rules.requiresAssociationBudgetApproval && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Note:</strong> With this enabled, the budget workflow will be: Draft →
                  Coach Review → <strong>Association Review</strong> → Team Approved → Present to
                  Parents
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parent Acknowledgment Threshold */}
        <Card>
          <CardHeader>
            <CardTitle>Parent Acknowledgment Threshold</CardTitle>
            <CardDescription>
              Set default threshold for how many parent acknowledgments are required before a budget
              is locked
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-medium">Threshold Mode</Label>
              <RadioGroup
                value={rules.parentAckMode}
                onValueChange={(value) =>
                  setRules({
                    ...rules,
                    parentAckMode: value as ParentAckMode,
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PERCENT" id="percent" />
                  <Label htmlFor="percent" className="font-normal cursor-pointer">
                    Percentage of families (recommended)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="COUNT" id="count" />
                  <Label htmlFor="count" className="font-normal cursor-pointer">
                    Fixed number of families
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {rules.parentAckMode === "PERCENT" ? (
              <div className="space-y-2">
                <Label htmlFor="percent-threshold">
                  Required Percentage (1-100%)
                </Label>
                <Input
                  id="percent-threshold"
                  type="number"
                  min="1"
                  max="100"
                  value={rules.parentAckPercentThreshold ?? 80}
                  onChange={(e) =>
                    setRules({
                      ...rules,
                      parentAckPercentThreshold: parseInt(e.target.value) || 80,
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Budget will be locked when at least {rules.parentAckPercentThreshold || 80}% of
                  eligible families have acknowledged
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="count-threshold">
                  Required Number of Families
                </Label>
                <Input
                  id="count-threshold"
                  type="number"
                  min="1"
                  value={rules.parentAckCountThreshold ?? 1}
                  onChange={(e) =>
                    setRules({
                      ...rules,
                      parentAckCountThreshold: parseInt(e.target.value) || 1,
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Budget will be locked when at least {rules.parentAckCountThreshold || 1} families
                  have acknowledged
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="eligible-definition">
                Eligible Families Definition
              </Label>
              <Select
                value={rules.eligibleFamilyDefinition}
                onValueChange={(value) =>
                  setRules({
                    ...rules,
                    eligibleFamilyDefinition: value as EligibleFamilyDefinition,
                  })
                }
              >
                <SelectTrigger id="eligible-definition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE_ROSTER_ONLY">
                    Active Roster Only
                  </SelectItem>
                  <SelectItem value="ACTIVE_ROSTER_AND_PAID" disabled>
                    Active Roster + Paid Registration (Future)
                  </SelectItem>
                  <SelectItem value="ALL_FAMILIES" disabled>
                    All Families (Future)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Determines which families count toward the threshold
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Team Override Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Team Override Settings</CardTitle>
            <CardDescription>
              Allow teams to customize their parent acknowledgment thresholds within defined bounds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="allow-override" className="text-base font-medium">
                  Allow Team Overrides
                </Label>
                <p className="text-sm text-muted-foreground">
                  If enabled, teams can set their own thresholds within the bounds you specify
                </p>
              </div>
              <Switch
                id="allow-override"
                checked={rules.allowTeamOverrideThreshold}
                onCheckedChange={(checked) =>
                  setRules({ ...rules, allowTeamOverrideThreshold: checked })
                }
              />
            </div>

            {rules.allowTeamOverrideThreshold && (
              <div className="space-y-4 pt-4 border-t">
                <p className="text-sm font-medium">Override Bounds</p>
                {rules.parentAckMode === "PERCENT" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min-percent">Minimum Percent</Label>
                      <Input
                        id="min-percent"
                        type="number"
                        min="1"
                        max="100"
                        placeholder="e.g., 50"
                        value={rules.overrideMinPercent ?? ""}
                        onChange={(e) =>
                          setRules({
                            ...rules,
                            overrideMinPercent: parseInt(e.target.value) || null,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-percent">Maximum Percent</Label>
                      <Input
                        id="max-percent"
                        type="number"
                        min="1"
                        max="100"
                        placeholder="e.g., 100"
                        value={rules.overrideMaxPercent ?? ""}
                        onChange={(e) =>
                          setRules({
                            ...rules,
                            overrideMaxPercent: parseInt(e.target.value) || null,
                          })
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min-count">Minimum Count</Label>
                      <Input
                        id="min-count"
                        type="number"
                        min="1"
                        placeholder="e.g., 5"
                        value={rules.overrideMinCount ?? ""}
                        onChange={(e) =>
                          setRules({
                            ...rules,
                            overrideMinCount: parseInt(e.target.value) || null,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-count">Maximum Count</Label>
                      <Input
                        id="max-count"
                        type="number"
                        min="1"
                        placeholder="e.g., 20"
                        value={rules.overrideMaxCount ?? ""}
                        onChange={(e) =>
                          setRules({
                            ...rules,
                            overrideMaxCount: parseInt(e.target.value) || null,
                          })
                        }
                      />
                    </div>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Teams will be able to set thresholds within these bounds
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={saveGovernanceRules} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Governance Rules
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
