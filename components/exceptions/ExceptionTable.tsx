/**
 * Table view for exceptions inbox
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import type { TransactionWithValidation } from '@/lib/types/exceptions'

interface ExceptionTableProps {
  transactions: TransactionWithValidation[]
  onRowClick: (transaction: TransactionWithValidation) => void
}

export function ExceptionTable({ transactions, onRowClick }: ExceptionTableProps) {
  const getSeverityBadge = (severity: string | null) => {
    if (!severity) return null

    const config = {
      CRITICAL: { label: 'Critical', className: 'bg-red-100 text-red-800 border-red-200' },
      HIGH: { label: 'High', className: 'bg-orange-100 text-orange-800 border-orange-200' },
      MEDIUM: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      LOW: { label: 'Low', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    }

    const { label, className } = config[severity as keyof typeof config] || config.LOW

    return (
      <Badge variant="outline" className={className}>
        {label}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const config = {
      EXCEPTION: {
        label: 'Exception',
        icon: AlertCircle,
        className: 'bg-red-50 text-red-700 border-red-200',
      },
      IMPORTED: {
        label: 'Imported',
        icon: Clock,
        className: 'bg-blue-50 text-blue-700 border-blue-200',
      },
      VALIDATED: {
        label: 'Validated',
        icon: CheckCircle,
        className: 'bg-green-50 text-green-700 border-green-200',
      },
      RESOLVED: {
        label: 'Resolved',
        icon: CheckCircle,
        className: 'bg-gray-50 text-gray-700 border-gray-200',
      },
    }

    const { label, icon: Icon, className } = config[status as keyof typeof config] || config.EXCEPTION

    return (
      <Badge variant="outline" className={`${className} gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const getViolationCount = (txn: TransactionWithValidation) => {
    if (!txn.validationJson?.violations) return 0
    return txn.validationJson.violations.filter(
      (v) => v.severity === 'ERROR' || v.severity === 'CRITICAL'
    ).length
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-cream/50 hover:bg-cream/50">
            <TableHead className="font-semibold text-navy">Date</TableHead>
            <TableHead className="font-semibold text-navy">Vendor</TableHead>
            <TableHead className="font-semibold text-navy">Category</TableHead>
            <TableHead className="font-semibold text-navy text-right">Amount</TableHead>
            <TableHead className="font-semibold text-navy">Status</TableHead>
            <TableHead className="font-semibold text-navy">Issues</TableHead>
            <TableHead className="font-semibold text-navy">Receipt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((txn) => (
            <TableRow
              key={txn.id}
              onClick={() => onRowClick(txn)}
              className="cursor-pointer hover:bg-cream/30"
            >
              <TableCell className="font-medium text-navy">
                {format(new Date(txn.transactionDate), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium text-navy">{txn.vendor}</div>
                  {txn.description && (
                    <div className="text-sm text-navy/60 truncate max-w-xs">
                      {txn.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {txn.category && (
                  <Badge
                    variant="outline"
                    style={{
                      backgroundColor: `${txn.category.color}20`,
                      borderColor: txn.category.color,
                      color: txn.category.color,
                    }}
                  >
                    {txn.category.name}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={`font-semibold ${
                    txn.type === 'INCOME' ? 'text-green-600' : 'text-navy'
                  }`}
                >
                  {txn.type === 'INCOME' ? '+' : ''}
                  {formatCurrency(Number(txn.amount))}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {getStatusBadge(txn.status)}
                  {txn.exceptionSeverity && getSeverityBadge(txn.exceptionSeverity)}
                </div>
              </TableCell>
              <TableCell>
                {txn.status === 'EXCEPTION' && (
                  <div className="flex items-center gap-1 text-sm text-navy/70">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span>{getViolationCount(txn)} issue(s)</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                {txn.receiptUrl ? (
                  <FileText className="h-4 w-4 text-green-600" />
                ) : txn.receiptStatus === 'REQUIRED_MISSING' ? (
                  <FileText className="h-4 w-4 text-red-500" />
                ) : (
                  <FileText className="h-4 w-4 text-gray-300" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
