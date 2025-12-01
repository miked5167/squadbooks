"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { RuleType, RuleFormData, ruleSchema } from "@/lib/validations/rule-schemas"
import { createRule, updateRule } from "../actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { RuleTypeSelector } from "./RuleTypeSelector"
import { MaxBudgetConfig } from "./rule-configs/MaxBudgetConfig"
import { MaxAssessmentConfig } from "./rule-configs/MaxAssessmentConfig"
import { MaxBuyoutConfig } from "./rule-configs/MaxBuyoutConfig"
import { ZeroBalanceConfig } from "./rule-configs/ZeroBalanceConfig"
import { ApprovalTiersConfig } from "./rule-configs/ApprovalTiersConfig"
import { RequiredExpensesConfig } from "./rule-configs/RequiredExpensesConfig"
import { SigningAuthorityConfig } from "./rule-configs/SigningAuthorityConfig"
import { Badge } from "@/components/ui/badge"
import { RuleReviewSummary } from "./RuleReviewSummary"

interface RuleFormProps {
  associationId: string
  associationCurrency: string
  open: boolean
  onOpenChange: (open: boolean) => void
  existingRule?: any // For editing
}

type FormStep = "type" | "basic" | "config" | "review"

export function RuleForm({
  associationId,
  associationCurrency,
  open,
  onOpenChange,
  existingRule,
}: RuleFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState<FormStep>("type")
  const [selectedType, setSelectedType] = useState<RuleType | null>(
    existingRule?.ruleType || null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form with default values based on rule type
  const getDefaultValues = () => {
    if (existingRule) {
      return {
        ruleType: existingRule.ruleType,
        name: existingRule.name,
        description: existingRule.description || "",
        isActive: existingRule.isActive,
        config: existingRule.config,
        approvalTiers: existingRule.approvalTiers || [],
        requiredExpenses: existingRule.requiredExpenses || [],
        signingAuthorityComposition: existingRule.signingAuthorityComposition || {},
      }
    }

    const defaults: any = {
      name: "",
      description: "",
      isActive: true,
      config: {},
    }

    if (selectedType) {
      defaults.ruleType = selectedType

      // Set type-specific defaults (use association's currency)
      switch (selectedType) {
        case "MAX_BUDGET":
        case "MAX_ASSESSMENT":
        case "MAX_BUYOUT":
          defaults.config = { maxAmount: 0, currency: associationCurrency }
          break
        case "ZERO_BALANCE":
          defaults.config = { tolerance: 0, requireBalancedBudget: true, currency: associationCurrency }
          break
        case "APPROVAL_TIERS":
          defaults.config = { currency: associationCurrency }
          defaults.approvalTiers = [{ min: 0, max: 100, approvals: 1 }]
          break
        case "REQUIRED_EXPENSES":
          defaults.config = { enforceStrict: true }
          defaults.requiredExpenses = [""]
          break
        case "SIGNING_AUTHORITY_COMPOSITION":
          defaults.config = {}
          defaults.signingAuthorityComposition = {
            min_team_officials: 1,
            min_parent_representatives: 2,
            min_total: 3,
            require_finance_experience: true,
            require_background_check: true,
          }
          break
      }
    }

    return defaults
  }

  const form = useForm({
    resolver: zodResolver(ruleSchema),
    defaultValues: getDefaultValues(),
  })

  // Reset form when dialog opens for a new rule
  useEffect(() => {
    if (open && !existingRule) {
      // Reset to fresh state for new rule
      setStep("type")
      setSelectedType(null)
      form.reset({
        name: "",
        description: "",
        isActive: true,
        config: {},
      })
    }
  }, [open, existingRule, form])

  // Reset form when rule type changes
  const handleTypeSelect = (type: RuleType) => {
    setSelectedType(type)

    // Build defaults directly with the new type to avoid stale state
    const defaults: any = {
      ruleType: type,
      name: "",
      description: "",
      isActive: true,
      config: {},
    }

    switch (type) {
      case "MAX_BUDGET":
      case "MAX_ASSESSMENT":
      case "MAX_BUYOUT":
        defaults.config = { maxAmount: 0, currency: associationCurrency }
        break
      case "ZERO_BALANCE":
        defaults.config = { tolerance: 0, requireBalancedBudget: true, currency: associationCurrency }
        break
      case "APPROVAL_TIERS":
        defaults.config = { currency: associationCurrency }
        defaults.approvalTiers = [{ min: 0, max: 100, approvals: 1 }]
        break
      case "REQUIRED_EXPENSES":
        defaults.config = { enforceStrict: true }
        defaults.requiredExpenses = [""]
        break
      case "SIGNING_AUTHORITY_COMPOSITION":
        defaults.config = {}
        defaults.signingAuthorityComposition = {
          min_team_officials: 1,
          min_parent_representatives: 2,
          min_total: 3,
          require_finance_experience: true,
          require_background_check: true,
        }
        break
    }

    form.reset(defaults)
    setStep("basic")
  }

  const handleNext = () => {
    if (step === "type") setStep("basic")
    else if (step === "basic") setStep("config")
    else if (step === "config") setStep("review")
  }

  const handleBack = () => {
    if (step === "review") setStep("config")
    else if (step === "config") setStep("basic")
    else if (step === "basic") setStep("type")
  }

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)

      const payload = {
        associationId,
        ruleType: data.ruleType,
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? true,
        config: data.config,
        approvalTiers: data.approvalTiers || null,
        requiredExpenses: data.requiredExpenses || null,
        signingAuthorityComposition: data.signingAuthorityComposition || null,
      }

      let result
      if (existingRule) {
        result = await updateRule({ id: existingRule.id, ...payload })
      } else {
        result = await createRule(payload)
      }

      if (result.success) {
        toast({
          title: existingRule ? "Rule updated" : "Rule created",
          description: `${data.name} has been ${existingRule ? "updated" : "created"} successfully.`,
        })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save rule",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving rule:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case "type":
        return (
          <div className="py-4">
            <RuleTypeSelector
              selectedType={selectedType}
              onSelect={handleTypeSelect}
            />
          </div>
        )

      case "basic":
        return (
          <div className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Budget Cap 2025-2026" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this rule
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details about this rule..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Explain the purpose or context of this rule
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )

      case "config":
        if (!selectedType) return null

        return (
          <div className="py-4">
            {selectedType === "MAX_BUDGET" && <MaxBudgetConfig form={form} currency={associationCurrency} />}
            {selectedType === "MAX_ASSESSMENT" && <MaxAssessmentConfig form={form} currency={associationCurrency} />}
            {selectedType === "MAX_BUYOUT" && <MaxBuyoutConfig form={form} currency={associationCurrency} />}
            {selectedType === "ZERO_BALANCE" && <ZeroBalanceConfig form={form} currency={associationCurrency} />}
            {selectedType === "APPROVAL_TIERS" && <ApprovalTiersConfig form={form} currency={associationCurrency} />}
            {selectedType === "REQUIRED_EXPENSES" && <RequiredExpensesConfig form={form} />}
            {selectedType === "SIGNING_AUTHORITY_COMPOSITION" && (
              <SigningAuthorityConfig form={form} />
            )}
          </div>
        )

      case "review":
        const values = form.getValues()
        return (
          <div className="py-4 space-y-4">
            <div className="rounded-lg border p-6 space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">Rule Type</span>
                <div className="mt-1">
                  <Badge variant="secondary">{selectedType?.replace(/_/g, ' ')}</Badge>
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Name</span>
                <p className="text-lg font-semibold text-gray-900">{values.name}</p>
              </div>
              {values.description && (
                <div>
                  <span className="text-sm text-muted-foreground">Description</span>
                  <p className="text-sm text-gray-700">{values.description}</p>
                </div>
              )}
              <div className="pt-4 border-t border-gray-200">
                <span className="text-sm text-muted-foreground mb-3 block">Rule Configuration</span>
                <RuleReviewSummary
                  ruleType={selectedType!}
                  config={values.config}
                  approvalTiers={values.approvalTiers}
                  requiredExpenses={values.requiredExpenses}
                  signingAuthorityComposition={values.signingAuthorityComposition}
                  currency={associationCurrency}
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case "type":
        return "Select Rule Type"
      case "basic":
        return "Basic Information"
      case "config":
        return "Configure Rule"
      case "review":
        return "Review & Confirm"
      default:
        return ""
    }
  }

  const getStepDescription = () => {
    switch (step) {
      case "type":
        return "Choose the type of governance rule you want to create"
      case "basic":
        return "Provide a name and description for this rule"
      case "config":
        return "Configure the specific parameters for this rule"
      case "review":
        return "Review your rule configuration before saving"
      default:
        return ""
    }
  }

  const canProceed = () => {
    if (step === "type") return selectedType !== null
    if (step === "basic") return form.getValues("name").length > 0
    if (step === "config") return true
    return false
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>{getStepDescription()}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {renderStepContent()}

            <DialogFooter className="gap-2 sm:gap-0">
              {step !== "type" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}

              {step !== "review" ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed() || isSubmitting}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {existingRule ? "Update Rule" : "Create Rule"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
