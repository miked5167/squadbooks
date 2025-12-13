'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Building2, Users, Settings, FileText, ArrowRight } from 'lucide-react';

interface AssociationCompletionScreenProps {
  associationId: string;
  associationName: string;
  adminName: string;
  usePreSeasonBudgets: boolean;
}

export function AssociationCompletionScreen({
  associationId,
  associationName,
  adminName,
  usePreSeasonBudgets,
}: AssociationCompletionScreenProps) {
  const router = useRouter();

  const nextSteps = [
    {
      icon: Users,
      title: 'Invite Board Members',
      description: 'Add other administrators and auditors to your association',
      action: 'Go to Settings',
      href: `/association/${associationId}/settings`,
    },
    {
      icon: Settings,
      title: 'Configure Governance Rules',
      description: 'Set up financial rules and approval requirements for teams',
      action: 'Set Up Rules',
      href: `/association/${associationId}/rules`,
    },
    usePreSeasonBudgets
      ? {
          icon: FileText,
          title: 'Review Pre-Season Budgets',
          description: 'Teams will start submitting budgets for your review',
          action: 'View Budgets',
          href: `/association/pre-season-budgets`,
        }
      : {
          icon: Building2,
          title: 'Monitor Teams',
          description: 'View all teams in your association and their financial status',
          action: 'View Teams',
          href: `/association/${associationId}/teams`,
        },
  ];

  const handleGoToDashboard = () => {
    router.push(`/association/${associationId}/overview`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full mb-6 animate-in zoom-in duration-300">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-display-2 md:text-display-1 font-bold text-navy mb-3">
          You're All Set!
        </h1>
        <p className="text-lg text-navy/70 mb-2">
          Welcome to HuddleBooks, {adminName}
        </p>
        <p className="text-navy/60">
          Your association <span className="font-semibold">{associationName}</span> is ready to go
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-navy mb-4">What's Next?</h2>
          <div className="space-y-4">
            {nextSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-navy mb-1">{step.title}</h3>
                    <p className="text-sm text-navy/70">{step.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(step.href)}
                    className="flex-shrink-0"
                  >
                    {step.action}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6 border border-blue-200">
        <h3 className="font-semibold text-navy mb-2">Pro Tip</h3>
        <p className="text-sm text-navy/80">
          Start by inviting your board members and setting up a few key financial rules.
          Teams will automatically appear in your dashboard as they complete their onboarding.
          You can monitor their financial health and compliance from your command center.
        </p>
      </div>

      <Button
        onClick={handleGoToDashboard}
        size="lg"
        className="w-full"
      >
        Go to Command Center
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>

      <p className="text-center text-sm text-navy/60 mt-4">
        Need help? Check out our{' '}
        <a href="/docs" className="text-blue-600 hover:underline">
          documentation
        </a>{' '}
        or contact support.
      </p>
    </div>
  );
}
