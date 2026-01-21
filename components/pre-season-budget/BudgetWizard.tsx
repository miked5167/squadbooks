'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { TeamInfoForm } from './TeamInfoForm'
import { BudgetTotalInput } from './BudgetTotalInput'
import { CategoryAllocator } from './CategoryAllocator'
import { ReviewSummary } from './ReviewSummary'

export interface PreSeasonBudgetData {
  // Team Info
  proposedTeamName: string
  proposedSeason: string
  teamType?: string
  ageDivision?: string
  competitiveLevel?: string

  // Budget Details
  totalBudget: number
  projectedPlayers: number
  perPlayerCost: number

  // Allocations
  allocations: Array<{
    categoryId: string
    categoryName: string
    allocated: number
    notes?: string
  }>
}

const STEPS = [
  { id: 1, name: 'Team Info', description: 'Basic team details' },
  { id: 2, name: 'Budget Total', description: 'Set your total budget' },
  { id: 3, name: 'Allocate Budget', description: 'Assign to categories' },
  { id: 4, name: 'Review & Submit', description: 'Final review' },
]

interface BudgetWizardProps {
  onComplete: (budgetId: string) => void
  initialData?: Partial<PreSeasonBudgetData>
}

export function BudgetWizard({ onComplete, initialData }: BudgetWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [budgetData, setBudgetData] = useState<Partial<PreSeasonBudgetData>>(
    initialData || {
      allocations: [],
    }
  )

  const progress = (currentStep / STEPS.length) * 100

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!(
          budgetData.proposedTeamName &&
          budgetData.proposedSeason &&
          budgetData.proposedTeamName.length >= 3
        )
      case 2:
        return !!(
          budgetData.totalBudget &&
          budgetData.projectedPlayers &&
          budgetData.totalBudget > 0 &&
          budgetData.projectedPlayers > 0
        )
      case 3:
        const totalAllocated = budgetData.allocations?.reduce(
          (sum, a) => sum + a.allocated,
          0
        ) || 0
        return Math.abs(totalAllocated - (budgetData.totalBudget || 0)) < 0.01
      case 4:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < STEPS.length && canProceed()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const updateBudgetData = (data: Partial<PreSeasonBudgetData>) => {
    setBudgetData((prev) => {
      const updated = { ...prev, ...data }

      // Auto-calculate per-player cost when budget or players change
      if (updated.totalBudget && updated.projectedPlayers) {
        updated.perPlayerCost = Number(
          (updated.totalBudget / updated.projectedPlayers).toFixed(2)
        )
      }

      return updated
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="mb-4">
          <h1 className="text-display-2 text-navy mb-2">
            Create Pre-Season Budget
          </h1>
          <p className="text-base text-navy/70">
            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}
          </p>
        </div>
        <Progress value={progress} className="h-2" />

        {/* Step Indicators */}
        <div className="mt-6 flex justify-between">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex-1 ${step.id < STEPS.length ? 'pr-4' : ''}`}
            >
              <div className="flex items-center">
                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2
                    ${
                      step.id < currentStep
                        ? 'bg-gold border-gold text-white'
                        : step.id === currentStep
                        ? 'border-gold text-gold'
                        : 'border-gray-300 text-gray-400'
                    }
                  `}
                >
                  {step.id < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p
                    className={`text-sm font-medium ${
                      step.id <= currentStep ? 'text-navy' : 'text-navy/40'
                    }`}
                  >
                    {step.name}
                  </p>
                  <p className="text-xs text-navy/60">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="border-navy/10">
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <TeamInfoForm
              data={budgetData}
              onChange={updateBudgetData}
            />
          )}
          {currentStep === 2 && (
            <BudgetTotalInput
              data={budgetData}
              onChange={updateBudgetData}
            />
          )}
          {currentStep === 3 && (
            <CategoryAllocator
              data={budgetData}
              onChange={updateBudgetData}
            />
          )}
          {currentStep === 4 && (
            <ReviewSummary
              data={budgetData as PreSeasonBudgetData}
              onComplete={onComplete}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="border-navy/20"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {currentStep < STEPS.length && (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-gold hover:bg-gold/90 text-white"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
