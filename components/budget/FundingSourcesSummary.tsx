'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, type FundingSource } from '@/lib/types/budget';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface FundingSourcesSummaryProps {
  fundingSources: FundingSource[];
  totalIncome: number;
  totalExpenses: number;
}

export function FundingSourcesSummary({
  fundingSources,
  totalIncome,
  totalExpenses,
}: FundingSourcesSummaryProps) {
  const netPosition = totalIncome - totalExpenses;
  const isPositive = netPosition >= 0;

  return (
    <Card className="border-0 shadow-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-navy flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Funding Sources
        </CardTitle>
        <p className="text-sm text-navy/60 mt-1">
          Income breakdown and net budget position
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Funding Sources List */}
        <div className="space-y-3">
          {fundingSources.length === 0 ? (
            <div className="text-center py-8 text-navy/60">
              <p>No income sources configured yet</p>
            </div>
          ) : (
            fundingSources.map((source) => {
              const percentReceived =
                source.budgeted > 0 ? (source.received / source.budgeted) * 100 : 0;

              return (
                <div
                  key={source.systemCategoryId}
                  className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-100 hover:border-green-200 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-navy text-sm">{source.name}</h4>
                    <p className="text-xs text-navy/60 mt-0.5">
                      {source.percentOfTotal.toFixed(1)}% of total income
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-navy tabular-nums">
                      {formatCurrency(source.received)}
                    </div>
                    <div className="text-xs text-navy/60">
                      of {formatCurrency(source.budgeted)}
                    </div>

                    {/* Progress indicator */}
                    {source.budgeted > 0 && (
                      <div className="mt-2 w-32">
                        <div className="h-1.5 bg-green-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-600 rounded-full transition-all"
                            style={{ width: `${Math.min(percentReceived, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Net Position Summary */}
        <div className="pt-4 border-t border-navy/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPositive ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
              <span className="font-semibold text-navy">Net Position</span>
            </div>

            <div className="text-right">
              <div
                className={`text-2xl font-bold tabular-nums ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(Math.abs(netPosition))}
              </div>
              <div className="text-xs text-navy/60">
                {isPositive ? 'Surplus' : 'Deficit'}
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-green-50 border border-green-100">
              <div className="text-xs text-navy/60 mb-1">Total Income</div>
              <div className="font-bold text-green-700 tabular-nums">
                {formatCurrency(totalIncome)}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
              <div className="text-xs text-navy/60 mb-1">Total Expenses</div>
              <div className="font-bold text-blue-700 tabular-nums">
                {formatCurrency(totalExpenses)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
