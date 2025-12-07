'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowDownCircle, ArrowUpCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { categorizeTransactions, getCategorizationStats } from '@/lib/services/transaction-categorizer';
import type { PlaidTransaction, CategorySuggestion, BankAccount } from '@/lib/types/banking';
import { formatCurrency } from '@/lib/utils/formatters';

interface TransactionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
  itemId: string; // Plaid item ID
  bankAccount: BankAccount;
  teamId?: string; // Optional for demo mode
  lastSyncedAt?: Date | null; // For smart sync - only fetch new transactions
  onImportComplete?: (importedCount: number) => void;
}

export function TransactionImportModal({
  isOpen,
  onClose,
  teamId,
  accessToken,
  itemId,
  bankAccount,
  lastSyncedAt,
  onImportComplete,
}: TransactionImportModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [suggestions, setSuggestions] = useState<Map<string, CategorySuggestion>>(new Map());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);

  // Fetch transactions on mount
  useEffect(() => {
    if (isOpen && accessToken) {
      fetchTransactions();
    }
  }, [isOpen, accessToken]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      // Calculate smart date range
      const endDate = new Date().toISOString().split('T')[0]; // Today
      const startDate = lastSyncedAt
        ? new Date(lastSyncedAt).toISOString().split('T')[0]
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days ago

      console.log(`📅 Fetching transactions from ${startDate} to ${endDate}`);

      const response = await fetch('/api/plaid/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          accountId: bankAccount.plaidAccountId,
          startDate,
          endDate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();

      if (data.success && data.transactions) {
        const txs = data.transactions as PlaidTransaction[];
        setTransactions(txs);

        // Auto-categorize transactions
        const categorized = categorizeTransactions(txs);
        setSuggestions(categorized);

        // Auto-select all non-pending transactions
        const autoSelected = new Set(
          txs.filter(tx => !tx.pending).map(tx => tx.id)
        );
        setSelectedIds(autoSelected);

        console.log('📊 Transaction Import Stats:', getCategorizationStats(txs, categorized));
      } else if (data.note) {
        // Transactions not ready yet
        toast({
          title: 'Transactions Loading',
          description: data.note,
        });
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load transactions',
        description: 'Please try again in a moment.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTransaction = (txId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(txId)) {
      newSelected.delete(txId);
    } else {
      newSelected.add(txId);
    }
    setSelectedIds(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map(tx => tx.id)));
    }
  };

  const handleImport = async () => {
    setIsImporting(true);

    try {
      // Get selected transactions with their categorizations
      const selectedTransactions = transactions
        .filter(tx => selectedIds.has(tx.id))
        .map(tx => {
          const suggestion = suggestions.get(tx.id);
          return {
            ...tx,
            assignedCategoryId: suggestion?.categoryId,
            suggestedCategoryName: suggestion?.categoryName,
            categoryConfidence: suggestion?.confidence,
          };
        });

      // If teamId provided, save to database via API
      if (teamId) {
        const response = await fetch('/api/transactions/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamId,
            transactions: selectedTransactions,
            bankConnection: {
              accessToken,
              itemId,
              plaidAccountId: bankAccount.plaidAccountId,
              institutionName: bankAccount.institutionName,
              accountName: bankAccount.accountName,
              accountMask: bankAccount.mask,
              accountType: bankAccount.type,
            },
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.details || error.error || 'Import failed');
        }

        const result = await response.json();

        toast({
          title: 'Transactions Imported!',
          description: result.message || `Successfully imported ${result.imported} transaction(s).`,
        });

        if (onImportComplete) {
          onImportComplete(result.imported);
        }
      } else {
        // Demo mode - store in sessionStorage only
        if (typeof window !== 'undefined') {
          const existing = sessionStorage.getItem('imported_transactions');
          const existingData = existing ? JSON.parse(existing) : [];

          sessionStorage.setItem(
            'imported_transactions',
            JSON.stringify([...existingData, ...selectedTransactions])
          );
        }

        toast({
          title: 'Transactions Imported (Demo Mode)!',
          description: `Successfully imported ${selectedTransactions.length} transaction(s) to session storage.`,
        });

        if (onImportComplete) {
          onImportComplete(selectedTransactions.length);
        }
      }

      onClose();
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import transactions. Please try again.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Calculate summary
  const selectedTransactions = transactions.filter(tx => selectedIds.has(tx.id));
  const totalIncome = selectedTransactions
    .filter(tx => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const totalExpenses = selectedTransactions
    .filter(tx => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null;

    if (confidence >= 90) {
      return <Badge variant="default" className="text-xs">High</Badge>;
    } else if (confidence >= 70) {
      return <Badge variant="secondary" className="text-xs">Medium</Badge>;
    } else {
      return <Badge variant="outline" className="text-xs">Low</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Transactions</DialogTitle>
          <DialogDescription>
            Review and import transactions from {bankAccount.institutionName}
            {lastSyncedAt && (
              <span className="block mt-1 text-xs">
                Syncing new transactions since last import
              </span>
            )}
            {!lastSyncedAt && (
              <span className="block mt-1 text-xs">
                Initial import - fetching last 7 days of transactions
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading transactions...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No transactions found. Try again in a few moments as transactions may still be processing.
            </p>
            <Button variant="outline" onClick={fetchTransactions} className="mt-4">
              Refresh
            </Button>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 py-4 border-y">
              <div className="text-center">
                <div className="text-2xl font-bold">{selectedTransactions.length}</div>
                <div className="text-sm text-muted-foreground">Selected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalIncome)}
                </div>
                <div className="text-sm text-muted-foreground">Income</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalExpenses)}
                </div>
                <div className="text-sm text-muted-foreground">Expenses</div>
              </div>
            </div>

            {/* Transaction List */}
            <div className="flex-1 overflow-y-auto space-y-2 py-4">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                <Checkbox
                  checked={selectedIds.size === transactions.length}
                  onCheckedChange={handleToggleAll}
                />
                <span className="text-sm font-medium">Select All</span>
              </div>

              {transactions.map((tx) => {
                const suggestion = suggestions.get(tx.id);
                const isSelected = selectedIds.has(tx.id);
                const isExpense = tx.amount > 0;

                return (
                  <div
                    key={tx.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      isSelected ? 'bg-muted/50 border-primary' : 'hover:bg-muted/30'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleTransaction(tx.id)}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{tx.merchantName || tx.name}</span>
                        {tx.pending && (
                          <Badge variant="outline" className="text-xs">Pending</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{tx.date}</div>
                      {suggestion && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Suggested: {suggestion.categoryName}
                          </span>
                          {getConfidenceBadge(suggestion.confidence)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isExpense ? (
                        <ArrowDownCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <ArrowUpCircle className="h-4 w-4 text-green-500" />
                      )}
                      <span className={`font-semibold ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(Math.abs(tx.amount))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isImporting}>
            Skip for now
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedIds.size === 0 || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              `Import ${selectedIds.size} Transaction${selectedIds.size !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
