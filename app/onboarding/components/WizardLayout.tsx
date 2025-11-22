import { Progress } from '@/components/ui/progress';

interface WizardLayoutProps {
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
}

export function WizardLayout({ currentStep, totalSteps, children }: WizardLayoutProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Progress Bar */}
      {currentStep <= totalSteps && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
          <div className="container max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className={currentStep <= totalSteps ? 'pt-24 pb-12' : 'py-12'}>
        <div className="container max-w-4xl mx-auto px-4">
          {children}
        </div>
      </div>
    </div>
  );
}
