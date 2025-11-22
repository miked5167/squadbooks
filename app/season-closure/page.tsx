'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Receipt,
  TrendingUp,
  ClipboardList,
  Package,
  Send,
} from 'lucide-react';

interface ValidationResult {
  isValid: boolean;
  budgetBalanced: boolean;
  allTransactionsApproved: boolean;
  allReceiptsPresent: boolean;
  bankReconciled: boolean;
  pendingCount: number;
  missingReceipts: number;
  unreconciledCount: number;
  receiptCount: number;
  totalTransactions: number;
  totalIncome: number;
  totalExpenses: number;
  finalBalance: number;
  errors: Array<{ code: string; message: string; severity: string }>;
  warnings: Array<{ code: string; message: string; severity: string }>;
}

interface TeamInfo {
  id: string;
  name: string;
  season: string;
}

export default function SeasonClosurePage() {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [associationEmail, setAssociationEmail] = useState('');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showSuccessState, setShowSuccessState] = useState(false);

  const hasValidationRun = validationResult !== null;
  const hasErrors = validationResult?.errors.length || 0 > 0;
  const hasWarnings = validationResult?.warnings.length || 0 > 0;
  const isValid = validationResult?.isValid || false;

  /**
   * Run validation check
   */
  const runValidation = async () => {
    setIsValidating(true);

    try {
      const response = await fetch('/api/season-closure/validate');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate');
      }

      setValidationResult(data.validation);
      setTeamInfo(data.team);
    } catch (error: any) {
      alert(error.message || 'Failed to run validation');
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Handle submission
   */
  const handleSubmit = async (overrideWarnings = false) => {
    if (!associationEmail) {
      alert('Please enter the association email address');
      return;
    }

    // If there are warnings and user hasn't confirmed, show modal
    if (hasWarnings && !overrideWarnings) {
      setShowWarningModal(true);
      return;
    }

    setShowWarningModal(false);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/season-closure/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          associationEmail,
          overrideWarnings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if warnings need confirmation
        if (data.requiresConfirmation) {
          setShowWarningModal(true);
          return;
        }

        throw new Error(data.error || 'Failed to submit');
      }

      // Success!
      setShowSuccessState(true);
    } catch (error: any) {
      alert(error.message || 'Failed to submit season closure');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show success state
  if (showSuccessState) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card className="border-green-200">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Season Closure Package Submitted!</CardTitle>
            <CardDescription>
              Your financial package has been successfully generated and sent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Send className="h-4 w-4" />
              <AlertTitle>Email Sent</AlertTitle>
              <AlertDescription>
                The complete season closure package has been sent to{' '}
                <strong>{associationEmail}</strong>. The association will receive:
                <ul className="list-disc list-inside mt-2 ml-4">
                  <li>All financial reports (PDF)</li>
                  <li>All receipt files</li>
                  <li>A secure download link</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="mt-6 flex gap-4 justify-center">
              <Button onClick={() => router.push('/dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Close Season</h1>
        <p className="text-muted-foreground">
          {teamInfo
            ? `Submit your final financial package for ${teamInfo.name} (${teamInfo.season})`
            : 'Validate and submit your season financial package to the association'}
        </p>
      </div>

      {/* Initial State - Run Validation */}
      {!hasValidationRun && (
        <Card>
          <CardHeader>
            <CardTitle>Season Closure Wizard</CardTitle>
            <CardDescription>
              This wizard will help you prepare and submit your end-of-season financial package to
              the association
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              We'll validate that your season is ready to close, generate comprehensive financial
              reports, and send everything to your association.
            </p>

            <Button onClick={runValidation} disabled={isValidating} size="lg" className="w-full">
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Validation...
                </>
              ) : (
                'Run Validation Check'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {hasValidationRun && (
        <div className="space-y-6">
          {/* Validation Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Validation Checklist
              </CardTitle>
              <CardDescription>
                All items must pass before you can submit your season closure package
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ChecklistItem
                passed={validationResult.budgetBalanced}
                label="Budget Balanced ($0 remaining)"
                successMessage={`Budget is balanced at $${validationResult.finalBalance.toFixed(2)}`}
                errorMessage={`Budget is not balanced. Current balance: $${validationResult.finalBalance.toFixed(2)}`}
              />

              <ChecklistItem
                passed={validationResult.allTransactionsApproved}
                label="All Transactions Approved"
                successMessage={`All ${validationResult.totalTransactions} transactions are approved`}
                errorMessage={`${validationResult.pendingCount} transaction(s) pending approval`}
              />

              <ChecklistItem
                passed={validationResult.allReceiptsPresent}
                label="All Required Receipts Present"
                successMessage={`All required receipts are attached (${validationResult.receiptCount} total)`}
                errorMessage={`${validationResult.missingReceipts} expense(s) over $100 missing receipts`}
              />

              <ChecklistItem
                passed={validationResult.bankReconciled}
                label="Bank Reconciled"
                isWarning={!validationResult.bankReconciled}
                successMessage="Bank account is fully reconciled"
                errorMessage={`${validationResult.unreconciledCount} unreconciled transaction(s) in last 30 days (warning only)`}
              />
            </CardContent>
          </Card>

          {/* Errors */}
          {hasErrors && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Cannot Submit - Issues Found</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2">
                  {validationResult.errors.map((error, index) => (
                    <li key={index} className="mt-1">
                      {error.message}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm">
                  Please resolve these issues before submitting your season closure package.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Warnings */}
          {hasWarnings && !hasErrors && (
            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">Warnings Detected</AlertTitle>
              <AlertDescription className="text-yellow-700">
                <ul className="list-disc list-inside mt-2">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index} className="mt-1">
                      {warning.message}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm">
                  These are non-blocking warnings. You can proceed with submission, but it's
                  recommended to address them first.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Package Preview */}
          {isValid && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Package Contents
                  </CardTitle>
                  <CardDescription>
                    The following items will be included in your season closure package
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <PackageItem
                      icon={<FileText className="h-4 w-4" />}
                      title="Final Budget Report"
                      description="Complete budget breakdown by category"
                    />
                    <PackageItem
                      icon={<ClipboardList className="h-4 w-4" />}
                      title="Complete Transaction History"
                      description={`All ${validationResult.totalTransactions} transactions with details`}
                    />
                    <PackageItem
                      icon={<TrendingUp className="h-4 w-4" />}
                      title="Budget Variance Analysis"
                      description="Budget vs actual spending comparison"
                    />
                    <PackageItem
                      icon={<ClipboardList className="h-4 w-4" />}
                      title="Audit Trail Report"
                      description="Complete audit log of all financial actions"
                    />
                    <PackageItem
                      icon={<Receipt className="h-4 w-4" />}
                      title={`All Receipts (${validationResult.receiptCount} files)`}
                      description="Individual receipt files organized by transaction"
                    />
                  </div>

                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Financial Summary</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Income</p>
                        <p className="text-lg font-bold text-green-600">
                          ${validationResult.totalIncome.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Expenses</p>
                        <p className="text-lg font-bold text-red-600">
                          ${validationResult.totalExpenses.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Final Balance</p>
                        <p className="text-lg font-bold">
                          ${validationResult.finalBalance.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Association Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Association Contact</CardTitle>
                  <CardDescription>
                    Enter the email address where the season closure package should be sent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="email">Association Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="association@example.com"
                      value={associationEmail}
                      onChange={(e) => setAssociationEmail(e.target.value)}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      The complete financial package will be sent to this email address with all
                      reports and receipts included.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={runValidation} disabled={isValidating}>
                  Re-run Validation
                </Button>

                <Button
                  size="lg"
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting || !associationEmail}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Package...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Season Closure Package
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Re-validate button if not valid */}
          {!isValid && (
            <div className="flex justify-center">
              <Button onClick={runValidation} disabled={isValidating}>
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Re-run Validation'
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Warning Confirmation Modal */}
      <Dialog open={showWarningModal} onOpenChange={setShowWarningModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Confirm Submission with Warnings
            </DialogTitle>
            <DialogDescription>
              Your season closure has warnings that should ideally be addressed.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              The following warnings were detected:
            </p>
            <ul className="list-disc list-inside text-sm space-y-2">
              {validationResult?.warnings.map((warning, index) => (
                <li key={index}>{warning.message}</li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              Are you sure you want to proceed with submission? This will be noted in your audit
              trail.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarningModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSubmit(true)} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Anyway'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component for checklist items
function ChecklistItem({
  passed,
  label,
  successMessage,
  errorMessage,
  isWarning = false,
}: {
  passed: boolean;
  label: string;
  successMessage: string;
  errorMessage: string;
  isWarning?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg">
      {passed ? (
        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
      ) : isWarning ? (
        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
      ) : (
        <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        <p className={`text-sm ${passed ? 'text-green-600' : isWarning ? 'text-yellow-600' : 'text-red-600'}`}>
          {passed ? successMessage : errorMessage}
        </p>
      </div>
    </div>
  );
}

// Helper component for package items
function PackageItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-primary/10 rounded-lg text-primary">{icon}</div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
