import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Info, Mail, Phone, FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface TransparencyCardProps {
  treasurerName?: string
  treasurerEmail?: string
  treasurerPhone?: string
}

export function TransparencyCard({
  treasurerName,
  treasurerEmail,
  treasurerPhone,
}: TransparencyCardProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-navy flex items-center gap-2">
          <Info className="w-4 h-4" />
          Transparency & Help
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Helper Text */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            All financial data is updated in real-time as transactions are approved by your team
            treasurer.
          </p>
        </div>

        {/* Contact Treasurer */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-navy">Questions?</h4>
          {treasurerName || treasurerEmail || treasurerPhone ? (
            <div className="space-y-2">
              {treasurerName && (
                <p className="text-sm text-navy/70">
                  Contact your team treasurer:
                  <span className="block font-medium text-navy mt-1">{treasurerName}</span>
                </p>
              )}
              {treasurerEmail && (
                <a
                  href={`mailto:${treasurerEmail}`}
                  className="flex items-center gap-2 text-sm text-navy hover:text-navy-medium transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {treasurerEmail}
                </a>
              )}
              {treasurerPhone && (
                <a
                  href={`tel:${treasurerPhone}`}
                  className="flex items-center gap-2 text-sm text-navy hover:text-navy-medium transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {treasurerPhone}
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-navy/60">
              Contact your team treasurer for questions about specific transactions or the budget.
            </p>
          )}
        </div>

        <Separator className="bg-navy/10" />

        {/* Policy Links */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-navy">Resources</h4>
          <div className="space-y-1">
            <Button asChild variant="ghost" size="sm" className="w-full justify-start text-navy/70 h-auto py-2">
              <Link href="/budget">
                <FileText className="w-4 h-4 mr-2" />
                Team Budget
                <ArrowRight className="w-3 h-3 ml-auto" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="w-full justify-start text-navy/70 h-auto py-2">
              <Link href="/transactions">
                <FileText className="w-4 h-4 mr-2" />
                Transaction History
                <ArrowRight className="w-3 h-3 ml-auto" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Data Freshness Note */}
        <div className="pt-2 text-xs text-navy/50 text-center">
          Data updates automatically when transactions are approved
        </div>
      </CardContent>
    </Card>
  )
}
