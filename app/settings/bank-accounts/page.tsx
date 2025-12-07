/**
 * Bank Accounts Settings Page
 * Manage connected bank accounts and transaction sync
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlaidLinkButton } from '@/components/banking/PlaidLinkButton';
import { TransactionImportModal } from '@/components/banking/TransactionImportModal';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  Download,
  AlertCircle,
} from 'lucide-react';
import type {
  BankAccount,
  ExchangeTokenResponse,
  PlaidLinkOnSuccessMetadata,
} from '@/lib/types/banking';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';

export default function BankAccountsPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [showTransactionImport, setShowTransactionImport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch bank connections from database on mount
  const fetchBankConnections = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/plaid/bank-connections');

      if (!response.ok) {
        throw new Error('Failed to fetch bank connections');
      }

      const data = await response.json();

      if (data.success) {
        setAccounts(data.accounts || []);
        setAccessToken(data.accessToken || '');
      }
    } catch (error) {
      console.error('Failed to load bank connections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bank connections.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBankConnections();
  }, []);

  const handleBankConnectSuccess = async (
    data: ExchangeTokenResponse & { accessToken: string },
    metadata: PlaidLinkOnSuccessMetadata
  ) => {
    console.log('🏦 Bank connected successfully!', { data, metadata });

    toast({
      title: 'Bank Connected!',
      description: `Successfully connected ${data.accounts?.length || 0} account(s).`,
    });

    // Refresh the list from database
    await fetchBankConnections();

    // Open import modal for first account if available
    if (data.accounts && data.accounts.length > 0) {
      setSelectedAccount(data.accounts[0]);
      setShowTransactionImport(true);
    }
  };

  const handleSyncTransactions = (account: BankAccount) => {
    setSelectedAccount(account);
    setShowTransactionImport(true);
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      const response = await fetch(`/api/plaid/bank-connections?connectionId=${accountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect bank account');
      }

      toast({
        title: 'Account Disconnected',
        description: 'Bank account has been removed.',
      });

      // Refresh the list from database
      await fetchBankConnections();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect bank account.',
        variant: 'destructive',
      });
    }
  };

  const handleImportComplete = async (importedCount: number) => {
    toast({
      title: 'Import Complete',
      description: `Successfully imported ${importedCount} transactions.`,
    });

    // Refresh bank connections to update last synced time
    await fetchBankConnections();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-navy mb-2">Bank Accounts</h2>
        <p className="text-navy/60">
          Connect your bank accounts to automatically import transactions and reconcile your books.
        </p>
      </div>

      {/* Connect New Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Connect a Bank Account
          </CardTitle>
          <CardDescription>
            Securely connect your team's bank account using Plaid. Your credentials are encrypted and
            never stored on our servers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlaidLinkButton
            onSuccess={handleBankConnectSuccess}
            buttonText="Connect Bank Account"
            buttonVariant="default"
          />
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-navy">Connected Accounts</h3>

          {accounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-lg">{account.accountName}</h4>
                        {account.isActive ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Disconnected
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {account.institutionName} •••• {account.mask}
                      </p>

                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Type</p>
                          <p className="text-lg font-semibold capitalize">
                            {account.accountType}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Connected {formatDate(account.connectedAt.toString())}
                        </div>
                        <div className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Last sync {formatDate(account.lastSyncedAt.toString())}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSyncTransactions(account)}
                      disabled={!accessToken}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Import Transactions
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(account.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {accounts.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Bank Accounts Connected</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              Connect your bank account to automatically import transactions and save time on manual
              entry. Your data is secure and encrypted.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Transaction Import Modal */}
      {selectedAccount && accessToken && (
        <TransactionImportModal
          isOpen={showTransactionImport}
          onClose={() => setShowTransactionImport(false)}
          accessToken={accessToken}
          bankAccount={selectedAccount}
          lastSyncedAt={selectedAccount.lastSyncedAt}
          onImportComplete={handleImportComplete}
        />
      )}
    </div>
  );
}
