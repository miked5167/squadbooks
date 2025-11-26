'use client';

import { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { WizardLayout } from './components/WizardLayout';
import { StepTeamBasics } from './components/StepTeamBasics';
import { StepRoster } from './components/StepRoster';
import { StepBudget } from './components/StepBudget';
import { StepPowerUp } from './components/StepPowerUp';
import { CompletionScreen } from './components/CompletionScreen';
import {
  trackOnboardingEvent,
  setupAbandonTracking,
  getStepName,
} from '@/lib/analytics/onboarding-analytics';

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    teamId: '',
    teamName: '',
    teamType: '',
    ageDivision: '',
    competitiveLevel: '',
    season: '',
    familyCount: 0,
    budgetTotal: 0,
    bankConnected: false,
    approverAdded: false,
  });

  const totalSteps = 4;

  // Track when user starts a new step
  useEffect(() => {
    trackOnboardingEvent({
      step: currentStep,
      stepName: getStepName(currentStep),
      action: 'start',
    });

    // Setup abandon tracking (will fire if user closes tab/browser)
    const cleanup = setupAbandonTracking(currentStep, getStepName(currentStep));
    return cleanup;
  }, [currentStep]);

  return (
    <WizardLayout currentStep={currentStep} totalSteps={totalSteps}>
      {currentStep === 1 && (
        <StepTeamBasics
          initialData={{
            teamId: wizardData.teamId,
            name: wizardData.teamName,
            teamType: wizardData.teamType,
            ageDivision: wizardData.ageDivision,
            competitiveLevel: wizardData.competitiveLevel,
            season: wizardData.season,
          }}
          onComplete={(data) => {
            // Track completion
            trackOnboardingEvent({
              step: 1,
              stepName: getStepName(1),
              action: 'complete',
              metadata: {
                teamType: data.teamType,
                ageDivision: data.ageDivision,
                competitiveLevel: data.competitiveLevel,
              },
            });

            setWizardData({
              ...wizardData,
              teamId: data.teamId,
              teamName: data.name,
              teamType: data.teamType,
              ageDivision: data.ageDivision,
              competitiveLevel: data.competitiveLevel,
              season: data.season
            });
            setCurrentStep(2);
          }}
        />
      )}

      {currentStep === 2 && (
        <StepRoster
          teamId={wizardData.teamId}
          onComplete={(familyCount) => {
            // Track completion
            trackOnboardingEvent({
              step: 2,
              stepName: getStepName(2),
              action: 'complete',
              metadata: {
                familyCount,
              },
            });

            setWizardData({ ...wizardData, familyCount });
            setCurrentStep(3);
          }}
          onBack={() => {
            // Track back navigation
            trackOnboardingEvent({
              step: 2,
              stepName: getStepName(2),
              action: 'back',
            });
            setCurrentStep(1);
          }}
          onSkip={() => {
            // Track skip
            trackOnboardingEvent({
              step: 2,
              stepName: getStepName(2),
              action: 'skip',
            });
            setWizardData({ ...wizardData, familyCount: 0 });
            setCurrentStep(3);
          }}
        />
      )}

      {currentStep === 3 && (
        <StepBudget
          teamId={wizardData.teamId}
          teamType={wizardData.teamType}
          ageDivision={wizardData.ageDivision}
          competitiveLevel={wizardData.competitiveLevel}
          familyCount={wizardData.familyCount}
          onComplete={(budgetTotal) => {
            // Track completion
            trackOnboardingEvent({
              step: 3,
              stepName: getStepName(3),
              action: 'complete',
              metadata: {
                budgetTotal,
              },
            });

            setWizardData({ ...wizardData, budgetTotal });
            setCurrentStep(4);
          }}
          onBack={() => {
            // Track back navigation
            trackOnboardingEvent({
              step: 3,
              stepName: getStepName(3),
              action: 'back',
            });
            setCurrentStep(2);
          }}
        />
      )}

      {currentStep === 4 && (
        <StepPowerUp
          teamId={wizardData.teamId}
          teamName={wizardData.teamName}
          onComplete={(data) => {
            // Track completion
            trackOnboardingEvent({
              step: 4,
              stepName: getStepName(4),
              action: 'complete',
              metadata: {
                approverAdded: data.approverAdded,
                bankConnected: data.bankConnected,
              },
            });

            setWizardData({ ...wizardData, ...data });
            setCurrentStep(5);
          }}
          onSkip={() => {
            // Track skip
            trackOnboardingEvent({
              step: 4,
              stepName: getStepName(4),
              action: 'skip',
            });
            setCurrentStep(5);
          }}
          onBack={() => {
            // Track back navigation
            trackOnboardingEvent({
              step: 4,
              stepName: getStepName(4),
              action: 'back',
            });
            setCurrentStep(3);
          }}
        />
      )}

      {currentStep === 5 && (
        <CompletionScreen
          teamName={wizardData.teamName}
          season={wizardData.season}
          budgetTotal={wizardData.budgetTotal}
          bankConnected={wizardData.bankConnected}
          approverAdded={wizardData.approverAdded}
        />
      )}
    </WizardLayout>
  );
}
