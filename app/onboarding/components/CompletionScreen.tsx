'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';

interface CompletionScreenProps {
  teamName: string;
  season: string;
  budgetTotal: number;
  bankConnected?: boolean;
  approverAdded?: boolean;
}

export function CompletionScreen({
  teamName,
  season,
  budgetTotal,
  bankConnected = false,
  approverAdded = false,
}: CompletionScreenProps) {
  const router = useRouter();
  const { width, height } = useWindowSize();

  return (
    <div className="max-w-2xl mx-auto">
      <Confetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={500}
        gravity={0.3}
      />

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold mb-2">You&apos;re all set!</h1>
        <p className="text-lg text-muted-foreground">
          Your team is ready to start tracking finances
        </p>
      </div>

      {/* Summary */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Team</span>
              <span className="font-semibold">{teamName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Season</span>
              <span className="font-semibold">{season}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Budget</span>
              <span className="font-semibold">
                ${budgetTotal.toLocaleString()}
              </span>
            </div>
            {bankConnected && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Bank connected</span>
              </div>
            )}
            {approverAdded && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Approver added</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Here&apos;s what to do next:</h2>
        <div className="space-y-3">
          <NextStepCard
            title="Add your first expense"
            description="Record an expense to see how it all works"
            href="/transactions"
            priority="high"
          />
          <NextStepCard
            title="Fine-tune budget categories"
            description="Adjust allocations to match your needs"
            href="/budget"
          />
          {!bankConnected && (
            <NextStepCard
              title="Connect your bank"
              description="Auto-import transactions to save time"
              href="/settings/bank"
            />
          )}
          {!approverAdded && (
            <NextStepCard
              title="Add team president"
              description="Enable dual approval for protection"
              href="/settings/team"
            />
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Button
          size="lg"
          onClick={() => router.push('/dashboard')}
          className="min-w-[200px]"
        >
          Go to Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <p className="mt-4 text-sm text-muted-foreground">
          Need help?{' '}
          <a href="/help" className="text-primary hover:underline">
            Watch the 3-minute tutorial
          </a>
        </p>
      </div>
    </div>
  );
}

interface NextStepCardProps {
  title: string;
  description: string;
  href: string;
  priority?: 'high' | 'normal';
}

function NextStepCard({ title, description, href, priority }: NextStepCardProps) {
  const router = useRouter();

  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
        priority === 'high' ? 'border-primary' : ''
      }`}
      onClick={() => router.push(href)}
    >
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <h3 className="font-medium mb-1">
              {title}
              {priority === 'high' && (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  Recommended
                </span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </CardContent>
    </Card>
  );
}
