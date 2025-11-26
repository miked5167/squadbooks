import { Progress } from '@/components/ui/progress';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardLayoutProps {
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
}

const steps = [
  { number: 1, title: 'Team basics', description: 'Name, level, and season' },
  { number: 2, title: 'Team roster', description: 'Add your players (optional)' },
  { number: 3, title: 'Budget structure', description: 'Set your total budget' },
  { number: 4, title: 'Banking & permissions', description: 'Connect accounts' },
];

export function WizardLayout({ currentStep, totalSteps, children }: WizardLayoutProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-cream flex flex-col lg:flex-row">
      {/* Left Sidebar */}
      <aside className="lg:w-80 bg-navy border-r border-navy-medium p-8 lg:min-h-screen">
        {/* Logo/Brand */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white">Squadbooks</h2>
          <p className="text-sm text-white/70 mt-2">
            Set up your team in 4 quick steps.
          </p>
        </div>

        {/* Step List - Hidden on mobile, shown as horizontal on tablet, vertical on desktop */}
        <nav className="hidden lg:block space-y-6">
          {steps.map((step) => {
            const isCompleted = step.number < currentStep;
            const isCurrent = step.number === currentStep;
            const isPending = step.number > currentStep;

            return (
              <div
                key={step.number}
                className={cn(
                  'flex items-start gap-3 transition-all',
                  isCurrent && 'scale-105'
                )}
              >
                {/* Step Number/Check */}
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0 transition-all',
                    isCompleted && 'bg-meadow text-white',
                    isCurrent && 'bg-golden text-navy ring-4 ring-golden/30',
                    isPending && 'bg-navy-medium/30 text-white/50'
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.number}
                </div>

                {/* Step Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium transition-colors',
                      isCurrent && 'text-golden font-semibold',
                      isCompleted && 'text-white',
                      isPending && 'text-white/50'
                    )}
                  >
                    {step.title}
                  </p>
                  <p
                    className={cn(
                      'text-xs mt-0.5 transition-colors',
                      isCurrent && 'text-white/80',
                      isCompleted && 'text-white/70',
                      isPending && 'text-white/40'
                    )}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Mobile Progress Indicator */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-golden">
              {Math.round(progress)}% complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </aside>

      {/* Right Content Area */}
      <main className="flex-1 overflow-auto bg-cream">
        <div className="max-w-3xl mx-auto px-6 py-12 lg:px-12 lg:py-16">
          {children}
        </div>
      </main>
    </div>
  );
}
